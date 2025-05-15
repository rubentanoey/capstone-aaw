import http from "k6/http";
import { check, sleep, group } from "k6";
import { randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
  scenarios: {
    browsing_users: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "2m", target: 100 },
        { duration: "2m", target: 300 },
        { duration: "3m", target: 600 },
        { duration: "3m", target: 1200 },
      ],
      gracefulRampDown: "30s",
    },
    purchasing_users: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "2m", target: 100 },
        { duration: "2m", target: 300 },
        { duration: "3m", target: 600 },
        { duration: "3m", target: 1200 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<5000"],
    http_req_failed: ["rate<0.5"],
  },
  discardResponseBodies: true,
  noConnectionReuse: true,
};

export default function () {
  let token = auth();
  if (!token) return;

  if (__ITER % 3 === 0) {
    purchaseFlow(token);
  } else {
    browsingFlow(token);
  }
}

function purchaseFlow(token) {
  const flow = new PurchaseFlow(token);
  flow.execute();
}

function browsingFlow(token) {
  const flow = new BrowsingFlow(token);
  flow.execute();
}

function auth() {
  let result = null;

  group("Authentication", function () {
    let loginRes = http.post(
      "http://Capstone-LB-1266500702.us-east-1.elb.amazonaws.com/api/v1/auth/login",
      JSON.stringify({
        username: "seedinguser",
        password: "seedingpassword",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const success = check(loginRes, {
      "login successful": (r) => r.status === 200,
    });

    if (success) {
      result = JSON.parse(loginRes.body).token;
    }
  });

  sleep(Math.random() * 2);
  return result;
}

class BrowsingFlow {
  constructor(token) {
    this.API_BASE_URL = "http://Capstone-LB-1266500702.us-east-1.elb.amazonaws.com/api/v1";
    this.authHeader = { Authorization: `Bearer ${token}` };
  }

  execute() {
    group("Product Browsing", () => {
      // Step 1: Browse categories and select products
      const randomCategory = this.getRandomCategory();
      if (!randomCategory) return;
      
      const randomProducts = this.getRandomProductsFromCategory(randomCategory.id);
      if (!randomProducts || randomProducts.length === 0) return;
      
      // Step 2: Get detailed product information
      const productDetails = this.getProductDetails(randomProducts);
      if (!productDetails) return;
      
      // Step 3: Manage wishlist
      const wishlistId = this.createWishlist();
      if (!wishlistId) return;
      
      this.addProductsToWishlist(wishlistId, randomProducts);
      this.viewWishlists();
    });

    sleep(Math.random() * 3 + 1);
  }

  getRandomCategory() {
    let categoriesRes = http.get(
      `${this.API_BASE_URL}/product/category?page_number=1&page_size=10`
    );

    check(categoriesRes, {
      "categories retrieved": (r) => r.status === 200,
    });

    if (categoriesRes.status !== 200) return null;
    
    const categories = JSON.parse(categoriesRes.body).categories;
    return categories && categories.length > 0 ? randomItem(categories) : null;
  }

  getRandomProductsFromCategory(categoryId) {
    let categoryProductsRes = http.get(
      `${this.API_BASE_URL}/product/category/${categoryId}`,
      { headers: this.authHeader }
    );

    check(categoryProductsRes, {
      "category products retrieved": (r) => r.status === 200,
    });

    if (categoryProductsRes.status !== 200) return null;
    
    const products = JSON.parse(categoryProductsRes.body).products;
    if (!products || products.length === 0) return null;
    
    // Select random subset of products
    const randomCount = Math.floor(Math.random() * products.length) + 1;
    const selectedProductIds = [];
    
    for (let i = 0; i < randomCount; i++) {
      selectedProductIds.push(randomItem(products).id);
    }
    
    return selectedProductIds;
  }

  getProductDetails(productIds) {
    let productsRes = http.post(
      `${this.API_BASE_URL}/product/many`,
      JSON.stringify({ productIds }),
      {
        headers: {
          "Content-Type": "application/json",
          ...this.authHeader
        },
      }
    );

    check(productsRes, {
      "product details retrieved": (r) => r.status === 200,
    });
    
    return productsRes.status === 200 ? JSON.parse(productsRes.body) : null;
  }

  createWishlist() {
    let createWishlistRes = http.post(
      `${this.API_BASE_URL}/wishlist`,
      JSON.stringify({ name: "My Wishlist" }),
      {
        headers: {
          "Content-Type": "application/json",
          ...this.authHeader
        },
      }
    );

    check(createWishlistRes, {
      "wishlist created": (r) => r.status === 201,
    });
    
    return createWishlistRes.status === 201 ? 
      JSON.parse(createWishlistRes.body).id : null;
  }

  addProductsToWishlist(wishlistId, productIds) {
    for (const productId of productIds) {
      let addToWishlistRes = http.post(
        `${this.API_BASE_URL}/wishlist/add`,
        JSON.stringify({
          wishlist_id: wishlistId,
          product_id: productId,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...this.authHeader
          },
        }
      );

      check(addToWishlistRes, {
        "products added to wishlist": (r) => r.status === 200,
      });
    }
  }

  viewWishlists() {
    let wishlistRes = http.get(
      `${this.API_BASE_URL}/wishlist?page_number=1&page_size=10`,
      { headers: this.authHeader }
    );

    check(wishlistRes, {
      "wishlist retrieved": (r) => r.status === 200,
    });
  }
}

class PurchaseFlow {
  constructor(token) {
    this.API_BASE_URL = "http://Capstone-LB-1266500702.us-east-1.elb.amazonaws.com/api/v1";
    this.authHeader = { Authorization: `Bearer ${token}` };
    this.contentTypeHeader = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  }

  execute() {
    group("Shopping Flow", () => {
      // Step 1: Browse and select products
      const randomProducts = this.getRandomProducts();
      if (!randomProducts || randomProducts.length === 0) return;
      
      // Step 2: Add products to cart
      const addedToCart = this.addProductsToCart(randomProducts);
      if (!addedToCart) return;
      
      // Step 3: View cart contents
      this.viewCart();
      
      // Step 4: Place order
      const orderId = this.placeOrder();
      if (!orderId) return;
      
      // Step 5: Get order details and make payment
      this.processPayment(orderId);
    });

    sleep(Math.random() * 3 + 2);
  }

  getRandomProducts() {
    const randomNumber = Math.floor(Math.random() * 90) + 1;
    const randomSize = Math.floor(Math.random() * 90) + 1;

    let productsRes = http.get(
      `${this.API_BASE_URL}/product?page_number=${randomNumber}&page_size=${randomSize}`,
      { headers: this.authHeader }
    );

    check(productsRes, {
      "products retrieved": (r) => r.status === 200,
    });

    if (productsRes.status !== 200) return null;
    
    const products = JSON.parse(productsRes.body).products;
    if (!products || products.length === 0) return null;
    
    // Randomly select some products
    const randomCount = Math.floor(Math.random() * Math.min(products.length, 5)) + 1;
    const randomProducts = [];
    for (let i = 0; i < randomCount; i++) {
      const randomProduct = randomItem(products);
      randomProducts.push(randomProduct.id);
    }
    
    return randomProducts;
  }

  addProductsToCart(productIds) {
    let success = true;
    
    for (const productId of productIds) {
      let addToCartRes = http.post(
        `${this.API_BASE_URL}/cart`,
        JSON.stringify({
          product_id: productId,
          quantity: 1,
        }),
        { headers: this.contentTypeHeader }
      );

      const result = check(addToCartRes, {
        "product added to cart": (r) => r.status === 201,
      });
      
      if (!result) success = false;
    }
    
    return success;
  }

  viewCart() {
    let cartRes = http.get(
      `${this.API_BASE_URL}/cart?page_number=1&page_size=10`,
      { headers: this.authHeader }
    );

    check(cartRes, {
      "cart retrieved": (r) => r.status === 200,
    });
    
    return cartRes.status === 200;
  }

  placeOrder() {
    let orderRes = http.post(
      `${this.API_BASE_URL}/order`,
      JSON.stringify({
        shipping_provider: "TIKI",
      }),
      { headers: this.contentTypeHeader }
    );

    check(orderRes, {
      "order placed": (r) => r.status === 201,
    });

    if (orderRes.status !== 201) return null;
    
    const orderData = JSON.parse(orderRes.body);
    return orderData.order?.id;
  }

  processPayment(orderId) {
    let orderDetailsRes = http.get(
      `${this.API_BASE_URL}/order/${orderId}`,
      { headers: this.authHeader }
    );

    check(orderDetailsRes, {
      "order details retrieved": (r) => r.status === 200,
    });

    console.log(`Order details: ${orderDetailsRes.body}`);

    if (orderDetailsRes.status !== 200) return false;
    
    const orderDetails = JSON.parse(orderDetailsRes.body);
    const orderPrice = orderDetails.unit_price;
    const orderQuantity = orderDetails.quantity;

    // Pay for order
    let payOrderRes = http.post(
      `${this.API_BASE_URL}/order/${orderId}/pay`,
      JSON.stringify({
        payment_method: "BCA",
        payment_reference: "1234567890",
        amount: orderPrice * orderQuantity,
      }),
      { headers: this.contentTypeHeader }
    );

    check(payOrderRes, {
      "order paid": (r) => r.status === 200,
    });

    console.log(
      `Order ${payOrderRes.body}. Order ID: ${orderId}, Amount: ${orderPrice}`
    );
    
    return payOrderRes.status === 200;
  }
}