from locust import HttpUser, between, task, LoadTestShape
from faker import Faker
import random
import math

# Base URLs for each service:
AUTH_SERVICE_URL     = "http://localhost:8000"
ORDERS_SERVICE_URL   = "http://localhost:8001"
PRODUCTS_SERVICE_URL = "http://localhost:8002"
TENANT_SERVICE_URL   = "http://localhost:8003"
WISHLIST_SERVICE_URL = "http://localhost:8004"

fake = Faker()
admin_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJlOThlNDc3LTI0ZmYtNDU0Yi1iZGQ3LWJkY2FlNmI3MGY5NiIsInRlbmFudF9pZCI6IjQ3ZGQ2YjI0LTBiMjMtNDZiMC1hNjYyLTc3NjE1OGQwODliYSIsImlhdCI6MTc0MTI3OTkxNywiZXhwIjoxNzQxMzY2MzE3fQ.E0Ou6ur01rbnTgBWRx7_a8SEz6AKb4oZt5QtZKBKi-8"
admin_tenant = "47dd6b24-0b23-46b0-a662-776158d089ba"
admin_id = "2e98e477-24ff-454b-bdd7-bdcae6b70f96"

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
        self.period = 300   
        self.N_avg  = 20  
        self.A      = 15 
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
    available_product_ids = []
    available_category_ids = []
    cart_item_ids = []  
    order_ids = []
    wishlist_ids = []
    wishlist_item_ids = []

    def on_start(self):
        self.register_user()
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
            else:
                response.failure(f"Register failed: {response.text}")

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
                data = response.json()
                self.auth_token = data.get("token")
                if self.auth_token:
                    response.success()
                else:
                    response.failure("No token in login response.")
            else:
                response.failure(f"Login failed: {response.text}")

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


    @task(2)
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

    @task(1)
    def tenant_edit(self):
        """
        Mengubah tenant yang sudah disimpan di self.tenant_id.
        """
        if not admin_token or not self.tenant_id:
            return
        
        if self.tenant_id == admin_tenant:
            return
        
        payload = {
            "tenant_id": self.tenant_id,
            "owner_id":  admin_id,
            "name":      fake.catch_phrase()
        }
        headers = {"Authorization": f"Bearer {admin_token}"}
        with self.client.put(
            f"{TENANT_SERVICE_URL}/api/tenant/{self.tenant_id}",
            headers=headers,
            json=payload,
            name="TENANT: Edit Tenant",
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"Edit Tenant failed: {response.text}")

    @task(1)
    def tenant_delete(self):
        if not admin_token or not self.tenant_id:
            return
        
        if self.tenant_id == admin_tenant:
            return
        
        payload = {"tenant_id": self.tenant_id}
        headers = {"Authorization": f"Bearer {admin_token}"}
        with self.client.delete(
            f"{TENANT_SERVICE_URL}/api/tenant",
            headers=headers,
            json=payload,
            name="TENANT: Delete Tenant",
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"Delete Tenant failed: {response.text}")
            else:
                self.tenant_id = None

    ## ------------------------ PRODUCT ------------------------ ##

    @task(1)
    def fetch_product_ids(self):
        with self.client.get(
            f"{PRODUCTS_SERVICE_URL}/api/product",
            name="PRODUCT: Initial Get All",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.available_product_ids = [p["id"] for p in data]
                else:
                    self.available_product_ids = []
            else:
                response.failure(f"Get All Product failed: {response.text}")
                self.available_product_ids = []

    @task(1)
    def product_get_all(self):
        """
        Simple GET /api/product, no auth by default
        (Add headers if your API requires it.)
        """
        with self.client.get(
            f"{PRODUCTS_SERVICE_URL}/api/product",
            name="PRODUCT: Get All",
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"Get All Product failed: {response.text}")

    @task(1)
    def product_get_many(self):
        """
        Demo: POST /api/product/many with some known product IDs.
        If your environment differs, you can adapt.
        """

        if not self.available_product_ids:
            return
        
        if len(self.available_product_ids) < 5:
            return
        
        payload = {
            "productIds": list(random.choices(self.available_product_ids, k=5))
        }
        with self.client.post(
            f"{PRODUCTS_SERVICE_URL}/api/product/many",
            json=payload,
            name="PRODUCT: Get Many",
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"Get Many Products failed: {response.text}")

    @task(1)
    def product_get_all_categories(self):
        """
        GET /api/product/category
        """
        with self.client.get(
            f"{PRODUCTS_SERVICE_URL}/api/product/category",
            name="PRODUCT: Get All Categories",
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"Get All Categories failed: {response.text}")

    @task(1)
    def product_create(self):
        """
        Creates a new product (requires user auth).
        If success, we parse the returned JSON for the product ID
        and store it in self.available_product_ids.
        """
        if not admin_token:
            return

        if not self.available_category_ids:
            return

        headers = {"Authorization": f"Bearer {admin_token}"}
        payload = {
            "name": fake.word().title(),
            "description": fake.sentence(),
            "price": random.randint(1, 500),
            "quantity_available": random.randint(1, 100),
            "category_id": random.choice(self.available_category_ids)
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
                        response.success()
                    else:
                        response.failure("No category 'id' in creation response.")
                except Exception as e:
                    response.failure(f"Error parsing category creation: {e}")

    @task(1)
    def product_get_by_id(self):
        """
        Fetch a random product from self.available_product_ids (requires auth).
        Skip if we have none stored.
        """
        if not self.auth_token or not self.available_product_ids:
            return

        headers = {"Authorization": f"Bearer {self.auth_token}"}
        product_id = random.choice(self.available_product_ids)

        with self.client.get(
            f"{PRODUCTS_SERVICE_URL}/api/product/{product_id}",
            headers=headers,
            name="PRODUCT: Get Product by Id",
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"Get Product by Id failed: {response.text}")

    @task(1)
    def product_get_category_by_id(self):
        """
        Fetch a random category from self.available_category_ids,
        or fallback to a known ID if none exist.
        """
        if not self.auth_token and not self.available_category_ids:
            return
        
        if self.available_category_ids == []:
            return

        headers = {"Authorization": f"Bearer {self.auth_token}"}
        category_id = random.choice(self.available_category_ids)

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
        if not admin_token or not self.available_product_ids:
            return

        headers = {"Authorization": f"Bearer {admin_token}"}
        product_id = random.choice(self.available_product_ids)
        payload = {"price": random.randint(1, 1000)}

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

        headers = {"Authorization": f"Bearer {admin_token}"}
        if self.available_category_ids:
            category_id = random.choice(self.available_category_ids)
        else:
            category_id = fake.uuid4()

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

    @task(1)
    def product_delete(self):
        if not admin_token or not self.available_product_ids:
            return

        headers = {"Authorization": f"Bearer {admin_token}"}
        product_id = random.choice(self.available_product_ids)
        with self.client.delete(
            f"{PRODUCTS_SERVICE_URL}/api/product/{product_id}",
            headers=headers,
            name="PRODUCT: Delete Product",
            catch_response=True
        ) as response:
            if response.status_code not in [200, 204]:
                response.failure(f"Delete Product failed: {response.text}")
            else:
                self.available_product_ids.remove(product_id)

    @task(1)
    def product_delete_category(self):
        if not admin_token or not self.available_category_ids:
            return

        headers = {"Authorization": f"Bearer {admin_token}"}
        category_id = random.choice(self.available_category_ids)
        with self.client.delete(
            f"{PRODUCTS_SERVICE_URL}/api/product/category/{category_id}",
            headers=headers,
            name="PRODUCT: Delete Category",
            catch_response=True
        ) as response:
            if response.status_code not in [200, 204]:
                response.failure(f"Delete Category failed: {response.text}")
            else:
                self.available_category_ids.remove(category_id)

    ## ------------------------ ORDERS ------------------------ ##
    @task(1)
    def cart_get_all(self):
        if not self.auth_token:
            return
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        with self.client.get(f"{ORDERS_SERVICE_URL}/api/cart",
                             headers=headers,
                             name="ORDERS: Get All Cart",
                             catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Get All Cart failed: {response.text}")

    @task(1)
    def cart_add_item(self):
        if not self.auth_token:
            return
        if not self.available_product_ids:
            return
        payload = {
            "product_id": random.choice(self.available_product_ids),
            "quantity": random.randint(1, 10)
        }
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        with self.client.post(f"{ORDERS_SERVICE_URL}/api/cart",
                            headers=headers,
                            json=payload,
                            name="ORDERS: Add Item to Cart",
                            catch_response=True) as response:
            if response.status_code in [200, 201]:
                data = response.json()
                cart_item_id = data.get("id")
                if cart_item_id:
                    self.cart_item_ids.append(cart_item_id)
                    response.success()
                else:
                    response.failure(f"Missing cart item ID in response: {response.text}")
            else:
                response.failure(f"Add Item to Cart failed: {response.text}")


    @task(1)
    def cart_edit_item(self):
        if not self.auth_token or not hasattr(self, "cart_item_ids") or not self.cart_item_ids:
            return

        cart_item_id = random.choice(self.cart_item_ids)
        payload = {
            "cart_id": cart_item_id,
            "quantity": random.randint(2, 15)
        }
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        with self.client.put(f"{ORDERS_SERVICE_URL}/api/cart",
                            headers=headers,
                            json=payload,
                            name="ORDERS: Edit Cart Item",
                            catch_response=True) as response:
            if response.status_code not in [200, 201, 204]:
                response.failure(f"Edit Cart Item failed: {response.text}")


    @task(1)
    def cart_delete_item(self):
        if not self.auth_token or not hasattr(self, "cart_item_ids") or not self.cart_item_ids:
            return

        cart_item_id = random.choice(self.cart_item_ids)
        payload = {"product_id": cart_item_id}
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        with self.client.delete(f"{ORDERS_SERVICE_URL}/api/cart",
                                headers=headers,
                                json=payload,
                                name="ORDERS: Delete Cart Item",
                                catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Delete Cart Item failed: {response.text}")
            else:
                self.cart_item_ids.remove(cart_item_id)


    @task(1)
    def order_get_all(self):
        if not self.auth_token:
            return
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        with self.client.get(f"{ORDERS_SERVICE_URL}/api/order",
                             headers=headers,
                             name="ORDERS: Get All Order",
                             catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Get All Order failed: {response.text}")

    @task(1)
    def order_place(self):
        if not self.auth_token or not self.cart_item_ids:
            return

        shipping_providers = ['JNE', 'TIKI', 'SICEPAT', 'GOSEND', 'GRAB_EXPRESS']
        payload = {"shipping_provider": random.choice(shipping_providers)}
        headers = {"Authorization": f"Bearer {self.auth_token}"}

        with self.client.get(f"{ORDERS_SERVICE_URL}/api/cart",
                             headers=headers,
                             name="ORDERS: Get All Cart",
                             catch_response=True) as response:
            data = response.json()
            if data != []:
                with self.client.post(f"{ORDERS_SERVICE_URL}/api/order",
                                    headers=headers,
                                    json=payload,
                                    name="ORDERS: Place Order",
                                    catch_response=True) as response:
                    if response.status_code in [200, 201]:
                        data = response.json()
                        order_id = data.get("id")
                        if order_id:
                            if not hasattr(self, "order_ids"):
                                self.order_ids = []
                            self.order_ids.append(order_id)
                    else:
                        response.failure(f"Place Order failed: {response.text}")

    @task(1)
    def order_get_by_id(self):
        if not self.auth_token or not hasattr(self, "order_ids") or not self.order_ids:
            return
        order_id = random.choice(self.order_ids)
        headers = {"Authorization": f"Bearer {self.auth_token}"}

        with self.client.get(f"{ORDERS_SERVICE_URL}/api/order/{order_id}",
                            headers=headers,
                            name="ORDERS: Get Order by Id",
                            catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Get Order by Id failed: {response.text}")


    @task(1)
    def order_pay(self):
        if not self.auth_token or not hasattr(self, "order_ids") or not self.order_ids:
            return
        order_id = random.choice(self.order_ids)
        headers = {"Authorization": f"Bearer {self.auth_token}"}

        with self.client.get(f"{ORDERS_SERVICE_URL}/api/order/{order_id}",
                            headers=headers,
                            name="ORDERS: Get Order by Id",
                            catch_response=True) as response:
            data = response.json()
            tenant_details = data.get("order", {})
            total_amount = tenant_details.get("total_amount")
            payload = {
                "payment_method": "BCA",
                "payment_reference": fake.ean13(),
                "amount": total_amount
            }
            with self.client.post(f"{ORDERS_SERVICE_URL}/api/order/{order_id}/pay",
                                headers=headers,
                                json=payload,
                                name="ORDERS: Pay Order",
                                catch_response=True) as response:
                if response.status_code != 200:
                    response.failure(f"Pay Order failed: {response.text}")

    @task(1)
    def order_cancel(self):
        if not self.auth_token or not hasattr(self, "order_ids") or not self.order_ids:
            return
        order_id = random.choice(self.order_ids)
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        with self.client.post(f"{ORDERS_SERVICE_URL}/api/order/{order_id}/cancel",
                            headers=headers,
                            name="ORDERS: Cancel Order",
                            catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Cancel Order failed: {response.text}")

    ## ------------------------ WISHLIST ------------------------ ##

    @task(1)
    def wishlist_get_all(self):
        if not self.auth_token:
            return
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        with self.client.get(f"{WISHLIST_SERVICE_URL}/api/wishlist",
                            headers=headers,
                            name="WISHLIST: Get All",
                            catch_response=True) as response:
            if response.status_code == 401:
                response.failure("Get All Wishlist failed: Invalid token")
            elif response.status_code != 200:
                response.failure(f"Get All Wishlist failed: {response.text}")

    @task(1)
    def wishlist_create(self):
        if not self.auth_token:
            return
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        payload = {"name": "Wishlist " + fake.word().title()}
        with self.client.post(f"{WISHLIST_SERVICE_URL}/api/wishlist",
                            headers=headers,
                            json=payload,
                            name="WISHLIST: Create",
                            catch_response=True) as response:
            if response.status_code in [200, 201]:
                data = response.json()
                wishlist_id = data.get("id")
                if wishlist_id:
                    if not hasattr(self, "wishlist_ids"):
                        self.wishlist_ids = []
                    self.wishlist_ids.append(wishlist_id)
            else:
                response.failure(f"Create Wishlist failed: {response.text}")

    @task(1)
    def wishlist_edit(self):
        if not self.auth_token or not hasattr(self, "wishlist_ids") or not self.wishlist_ids:
            return 
        wishlist_id = random.choice(self.wishlist_ids)
        payload = {"name": fake.word().title()}
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        with self.client.put(f"{WISHLIST_SERVICE_URL}/api/wishlist/{wishlist_id}",
                            headers=headers,
                            json=payload,
                            name="WISHLIST: Edit",
                            catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Edit Wishlist failed: {response.text}")

    @task(1)
    def wishlist_add_item(self):
        if not self.auth_token or not hasattr(self, "wishlist_ids") or not self.wishlist_ids:
            return
        if not self.available_product_ids:
            return 
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        with self.client.get(f"{WISHLIST_SERVICE_URL}/api/wishlist",
                            headers=headers,
                            name="WISHLIST: Get All",
                            catch_response=True) as response:
            data = response.json()
            wishlist_ids = [w.get("id") for w in data]
            wishlist_id = random.choice(wishlist_ids)
            payload = {
                "wishlist_id": wishlist_id,
                "product_id": random.choice(self.available_product_ids)
            }
            with self.client.post(f"{WISHLIST_SERVICE_URL}/api/wishlist/add",
                                headers=headers,
                                json=payload,
                                name="WISHLIST: Add to Wishlist",
                                catch_response=True) as response:
                if response.status_code in [200, 201]:
                    data = response.json()
                    wishlist_item_id = data.get("id")
                    self.wishlist_item_ids.append(wishlist_item_id)
                else:
                    response.failure(f"Add to Wishlist failed: {response.text}")

