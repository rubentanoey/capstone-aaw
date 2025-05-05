from locust import HttpUser, between, task, LoadTestShape, events
from faker import Faker
import random
import math
import logging

# Base URLs for each service:
AUTH_SERVICE_URL     = "http://3.89.207.188:30001"
PRODUCTS_SERVICE_URL = "http://3.89.207.188:30002"
TENANT_SERVICE_URL   = "http://3.89.207.188:30003"

fake = Faker()
admin_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQxODBmMzFmLWQ2OWYtNDYwZS1hYjgyLTk0ZTMzYWZkZGM4MSIsInRlbmFudF9pZCI6IjQ3ZGQ2YjI0LTBiMjMtNDZiMC1hNjYyLTc3NjE1OGQwODliYSIsImlhdCI6MTc0NDk1OTEyNSwiZXhwIjoxNzQ1MDQ1NTI1fQ.kFDEcVqlnFAcQnb_A5wHiJa5acjYcdYFlLQSwUknIH8"
admin_tenant = "47dd6b24-0b23-46b0-a662-776158d089ba"
admin_id = "d180f31f-d69f-460e-ab82-94e33afddc81"

# Shared state for all users
class SharedState:
    available_categories = []
    available_products = []
    initialization_done = False

shared_state = SharedState()

# Initialize test data once before load test starts
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    logging.info("Initializing test data before starting load test...")
    client = environment.client
    
    # Authenticate as admin
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Ensure we have at least one category
    payload = {"name": "Default Category"}
    try:
        response = client.post(
            f"{PRODUCTS_SERVICE_URL}/api/product/category",
            headers=headers,
            json=payload,
            name="SETUP: Create Default Category"
        )
        if response.status_code in [200, 201]:
            data = response.json()
            cat_id = data.get("id")
            if cat_id:
                shared_state.available_categories.append(cat_id)
                logging.info(f"Created default category: {cat_id}")
    except Exception as e:
        logging.error(f"Failed to create default category: {e}")
    
    # Fetch existing categories
    try:
        response = client.get(
            f"{PRODUCTS_SERVICE_URL}/api/product/category",
            name="SETUP: Fetch Categories"
        )
        if response.status_code == 200:
            categories = response.json()
            if isinstance(categories, list):
                for cat in categories:
                    if cat.get("id") and cat.get("id") not in shared_state.available_categories:
                        shared_state.available_categories.append(cat.get("id"))
                logging.info(f"Found {len(shared_state.available_categories)} categories")
    except Exception as e:
        logging.error(f"Failed to fetch categories: {e}")
    
    # Fetch existing products
    try:
        response = client.get(
            f"{PRODUCTS_SERVICE_URL}/api/product",
            name="SETUP: Fetch Products"
        )
        if response.status_code == 200:
            products = response.json()
            if isinstance(products, list):
                for prod in products:
                    if prod.get("id"):
                        shared_state.available_products.append(prod.get("id"))
                logging.info(f"Found {len(shared_state.available_products)} products")
    except Exception as e:
        logging.error(f"Failed to fetch products: {e}")
    
    # Create default product if none exists
    if not shared_state.available_products and shared_state.available_categories:
        try:
            payload = {
                "name": "Default Product",
                "description": "Created during test initialization",
                "price": 99,
                "quantity_available": 100,
                "category_id": shared_state.available_categories[0]
            }
            response = client.post(
                f"{PRODUCTS_SERVICE_URL}/api/product",
                headers=headers,
                json=payload,
                name="SETUP: Create Default Product"
            )
            if response.status_code in [200, 201]:
                data = response.json()
                prod_id = data.get("id")
                if prod_id:
                    shared_state.available_products.append(prod_id)
                    logging.info(f"Created default product: {prod_id}")
        except Exception as e:
            logging.error(f"Failed to create default product: {e}")
    
    shared_state.initialization_done = True
    logging.info("Test data initialization complete")

class SinusoidalLoadShape(LoadTestShape):
    """
    Model beban dengan fungsi sinus:
    N(t) = N_avg + A * sin(2π * t / period + φ)

    period  : durasi satu siklus gelombang (dalam detik)
    N_avg   : jumlah rata-rata pengguna
    A       : amplitudo, yaitu puncak deviasi dari N_avg
    φ (phi) : fase awal (opsional)
    """
    def __init__(self):
        super().__init__()
        self.period = 40
        self.N_avg  = 80
        self.A      = 200
        self.phi    = 0 

    def tick(self):
        run_time = self.get_run_time()

        sinus_value = math.sin(
            (2 * math.pi * run_time / self.period) + self.phi
        )
        current_user_count = self.N_avg + self.A * sinus_value

        current_user_count = max(0, int(current_user_count))

        if current_user_count > 0:
            spawn_rate = current_user_count / 10
        else:
            spawn_rate = 1 
        return (current_user_count, spawn_rate)

class AAWUser(HttpUser):
    wait_time = between(1, 5)
    auth_token = None
    tenant_id  = None
    tenant_details_id = None
    cart_item_ids = []  
    order_ids = []
    wishlist_ids = []
    wishlist_item_ids = []

    def on_start(self):
        self.register_and_login()
        
        # Copy some IDs from shared state
        self.available_product_ids = list(shared_state.available_products)
        self.available_category_ids = list(shared_state.available_categories)

    def register_and_login(self):
        # Try register first
        success = self.register_user()
        
        # If registration failed, we'll try a generic login 
        if not success:
            self.login_user()

    def register_user(self):
        username = fake.user_name()
        payload = {
            "username": username,
            "email": fake.email(),
            "password": "Password123",
            "full_name": fake.name(),
            "address": fake.address(),
            "phone_number": fake.phone_number()
        }

        with self.client.post(
            f"{AUTH_SERVICE_URL}/api/auth/register",
            json=payload,
            name="AUTH: Register",
            catch_response=True
        ) as response:
            if response.status_code == 201:
                self.new_username = username
                self.new_password = "Password123"
                response.success()
                return True
            else:
                response.failure(f"Register failed: {response.text}")
                return False

    def login_user(self):
        username = getattr(self, "new_username", "john_doe")
        password = getattr(self, "new_password", "Password123")

        payload = {
            "username": username,
            "password": password
        }
        with self.client.post(
            f"{AUTH_SERVICE_URL}/api/auth/login",
            json=payload,
            name="AUTH: Login",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.auth_token = data.get("token")
                    if self.auth_token:
                        response.success()
                        return True
                    else:
                        response.failure("No token in login response.")
                        return False
                except Exception as e:
                    response.failure(f"Failed to parse login response: {e}")
                    return False
            else:
                response.failure(f"Login failed: {response.text}")
                return False

    @task(1)
    def auth_verify_token(self):
        if not self.auth_token:
            return
        
        payload = {"token": self.auth_token}
        with self.client.post(
            f"{AUTH_SERVICE_URL}/api/auth/verify-token",
            json=payload,
            name="AUTH: Verify Token",
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"Verify Token failed: {response.text}")
                # Token might be invalid, try to login again
                self.login_user()

    @task(1)
    def auth_verify_admin_token(self):
        payload = {"token": admin_token}
        with self.client.post(
            f"{AUTH_SERVICE_URL}/api/auth/verify-admin-token",
            json=payload,
            name="AUTH: Verify Admin Token",
            catch_response=True
        ) as response:
            if response.status_code not in [200, 403]:
                response.failure(
                    f"Admin Token verification unexpected: {response.status_code} {response.text}"
                )

    ## ------------------------ TENANT ------------------------ ##
    
    @task(1)
    def tenant_create_new(self):
        if not admin_token:
            return
        
        payload = {"name": fake.company()}
        headers = {"Authorization": f"Bearer {admin_token}"}
        with self.client.post(
            f"{TENANT_SERVICE_URL}/api/tenant",
            headers=headers,
            json=payload,
            name="TENANT: Create New Tenant",
            catch_response=True
        ) as response:
            if response.status_code not in [200, 201]:
                response.failure(f"Create Tenant failed: {response.text}")
            else:
                try:
                    data = response.json()
                    tenants = data.get("tenants", {})
                    self.tenant_id = tenants.get("id")
                    tenant_details = data.get("tenantDetails", {})
                    self.tenant_details_id = tenant_details.get("id")

                    if not self.tenant_id:
                        response.failure("No tenant_id in create tenant response.")
                    else:
                        response.success()

                except Exception as e:
                    response.failure(f"Create Tenant response parsing error: {e}")


    @task(1)
    def tenant_get_by_id(self):
        """
        Mendapatkan tenant berdasarkan self.tenant_id yang tersimpan.
        Apabila belum pernah dibuat (None), maka skip.
        """
        if not admin_token or not self.tenant_id:
            return
        
        headers = {"Authorization": f"Bearer {admin_token}"}
        with self.client.get(
            f"{TENANT_SERVICE_URL}/api/tenant/{self.tenant_id}",
            headers=headers,
            name="TENANT: Get Tenant by Id",
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"Get Tenant by Id failed: {response.text}")

    ## ------------------------ PRODUCT ------------------------ ##

    @task(2)  # Higher priority to ensure we have product data
    def fetch_product_ids(self):
        with self.client.get(
            f"{PRODUCTS_SERVICE_URL}/api/product",
            name="PRODUCT: Initial Get All",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        self.available_product_ids = [p.get("id") for p in data if p.get("id")]
                        # Also update shared state
                        for prod_id in self.available_product_ids:
                            if prod_id not in shared_state.available_products:
                                shared_state.available_products.append(prod_id)
                    response.success()
                except Exception as e:
                    response.failure(f"Failed to parse product list: {e}")
            else:
                response.failure(f"Get All Product failed: {response.text}")

    @task(2)  # Higher priority for categories too
    def fetch_category_ids(self):
        with self.client.get(
            f"{PRODUCTS_SERVICE_URL}/api/product/category",
            name="PRODUCT: Get All Categories",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        self.available_category_ids = [c.get("id") for c in data if c.get("id")]
                        # Also update shared state
                        for cat_id in self.available_category_ids:
                            if cat_id not in shared_state.available_categories:
                                shared_state.available_categories.append(cat_id)
                    response.success()
                except Exception as e:
                    response.failure(f"Failed to parse category list: {e}")
            else:
                response.failure(f"Get All Categories failed: {response.text}")

    @task(3)
    def product_get_all(self):
        with self.client.get(
            f"{PRODUCTS_SERVICE_URL}/api/product",
            name="PRODUCT: Get All",
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"Get All Product failed: {response.text}")

    @task(2)
    def product_get_many(self):
        # Get from shared state if local list is empty
        product_ids = self.available_product_ids or shared_state.available_products
        
        if not product_ids or len(product_ids) < 2:
            return
        
        # Select 1-5 products, or all if fewer than 5 exist
        num_to_select = min(random.randint(1, 5), len(product_ids))
        selected_ids = random.sample(product_ids, num_to_select)
        
        payload = {"productIds": selected_ids}
        
        with self.client.post(
            f"{PRODUCTS_SERVICE_URL}/api/product/many",
            json=payload,
            name="PRODUCT: Get Many",
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"Get Many Products failed: {response.text}")

    @task(1)
    def product_create(self):
        if not admin_token:
            return

        # Get from shared state if local list is empty
        category_ids = self.available_category_ids or shared_state.available_categories
        
        if not category_ids:
            # Create a category first
            category_name = fake.word().title()
            headers = {"Authorization": f"Bearer {admin_token}"}
            with self.client.post(
                f"{PRODUCTS_SERVICE_URL}/api/product/category",
                headers=headers,
                json={"name": category_name},
                name="PRODUCT: Create Category (Fallback)",
                catch_response=True
            ) as response:
                if response.status_code in [200, 201]:
                    try:
                        data = response.json()
                        cat_id = data.get("id")
                        if cat_id:
                            category_ids = [cat_id]
                            self.available_category_ids = [cat_id]
                            if cat_id not in shared_state.available_categories:
                                shared_state.available_categories.append(cat_id)
                    except Exception:
                        return  # Skip product creation if category creation fails
                else:
                    return  # Skip product creation if category creation fails

        headers = {"Authorization": f"Bearer {admin_token}"}
        payload = {
            "name": fake.word().title(),
            "description": fake.sentence(),
            "price": random.randint(1, 500),
            "quantity_available": random.randint(1, 100),
            "category_id": random.choice(category_ids)
        }
        
        with self.client.post(
            f"{PRODUCTS_SERVICE_URL}/api/product",
            headers=headers,
            json=payload,
            name="PRODUCT: Create Product",
            catch_response=True
        ) as response:
            if response.status_code not in [200, 201]:
                response.failure(f"Create Product failed: {response.text}")
            else:
                try:
                    data = response.json()
                    new_id = data.get("id")
                    if new_id:
                        self.available_product_ids.append(new_id)
                        if new_id not in shared_state.available_products:
                            shared_state.available_products.append(new_id)
                        response.success()
                    else:
                        response.failure("No product 'id' in creation response.")
                except Exception as e:
                    response.failure(f"Error parsing creation response: {e}")

    @task(1)
    def product_create_category(self):
        if not admin_token:
            return

        headers = {"Authorization": f"Bearer {admin_token}"}
        payload = {"name": fake.word().title()}
        
        with self.client.post(
            f"{PRODUCTS_SERVICE_URL}/api/product/category",
            headers=headers,
            json=payload,
            name="PRODUCT: Create Category",
            catch_response=True
        ) as response:
            if response.status_code not in [200, 201]:
                response.failure(f"Create Category failed: {response.text}")
            else:
                try:
                    data = response.json()
                    cat_id = data.get("id")
                    if cat_id:
                        self.available_category_ids.append(cat_id)
                        if cat_id not in shared_state.available_categories:
                            shared_state.available_categories.append(cat_id)
                        response.success()
                    else:
                        response.failure("No category 'id' in creation response.")
                except Exception as e:
                    response.failure(f"Error parsing category creation: {e}")

    @task(2)
    def product_get_by_id(self):
        # Get from shared state if local list is empty
        product_ids = self.available_product_ids or shared_state.available_products
        
        if not product_ids:
            return

        headers = {}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
            
        product_id = random.choice(product_ids)

        with self.client.get(
            f"{PRODUCTS_SERVICE_URL}/api/product/{product_id}",
            headers=headers,
            name="PRODUCT: Get Product by Id",
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"Get Product by Id failed: {response.text}")

    @task(2)
    def product_get_category_by_id(self):
        # Get from shared state if local list is empty
        category_ids = self.available_category_ids or shared_state.available_categories
        
        if not category_ids:
            return

        headers = {}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
            
        category_id = random.choice(category_ids)

        with self.client.get(
            f"{PRODUCTS_SERVICE_URL}/api/product/category/{category_id}",
            headers=headers,
            name="PRODUCT: Get Category by Id",
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"Get Category by Id failed: {response.text}")

    @task(1)
    def product_edit(self):
        if not admin_token:
            return
            
        # Get from shared state if local list is empty
        product_ids = self.available_product_ids or shared_state.available_products
        
        if not product_ids:
            return

        headers = {"Authorization": f"Bearer {admin_token}"}
        product_id = random.choice(product_ids)
        payload = {
            "price": random.randint(1, 1000),
            "quantity_available": random.randint(1, 200)
        }

        with self.client.put(
            f"{PRODUCTS_SERVICE_URL}/api/product/{product_id}",
            headers=headers,
            json=payload,
            name="PRODUCT: Edit Product",
            catch_response=True
        ) as response:
            if response.status_code not in [200, 204]:
                response.failure(f"Edit Product failed: {response.text}")

    @task(1)
    def product_edit_category(self):
        if not admin_token:
            return
            
        # Get from shared state if local list is empty
        category_ids = self.available_category_ids or shared_state.available_categories
        
        if not category_ids:
            return

        headers = {"Authorization": f"Bearer {admin_token}"}
        category_id = random.choice(category_ids)
        payload = {"name": fake.catch_phrase()}
        
        with self.client.put(
            f"{PRODUCTS_SERVICE_URL}/api/product/category/{category_id}",
            headers=headers,
            json=payload,
            name="PRODUCT: Edit Category",
            catch_response=True
        ) as response:
            if response.status_code not in [200, 204]:
                response.failure(f"Edit Category failed: {response.text}")