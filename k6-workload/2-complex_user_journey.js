import http from "k6/http";
import { check, sleep, group } from "k6";
import { randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
  scenarios: {
    browsing_users: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 50 },
        { duration: "3m", target: 50 },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
    purchasing_users: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 20 },
        { duration: "3m", target: 20 },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    "http_req_duration{scenario:browsing_users}": ["p(95)<400"],
    "http_req_duration{scenario:purchasing_users}": ["p(95)<600"],
    http_req_failed: ["rate<0.02"],
  },
};

export default function () {
  // Authentication
  let token = auth();
  if (!token) return;

  // Based on scenario
  if (__ITER % 3 === 0) {
    purchaseFlow(token);
  } else {
    browsingFlow(token);
  }
}

function auth() {
  let result = null;

  group("Authentication", function () {
    let loginRes = http.post(
      "http://localhost:8000/api/v1/auth/login",
      JSON.stringify({
        username: `user${__VU}`,
        password: "Password123",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const success = check(loginRes, {
      "login successful": (r) => r.status === 200,
    });

    if (success) {
      result = JSON.parse(loginRes.body).data.token;
    }
  });

  sleep(Math.random() * 2);
  return result;
}

function browsingFlow(token) {
  group("Product Browsing", function () {
    // Get product categories
    let categoriesRes = http.get(
      "http://localhost:8002/api/v1/product/category",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    check(categoriesRes, {
      "categories retrieved": (r) => r.status === 200,
    });

    // Select random category and view products
    if (categoriesRes.status === 200) {
      const categories = JSON.parse(categoriesRes.body).data.categories;
      if (categories && categories.length > 0) {
        const randomCategory = randomItem(categories);

        let categoryProductsRes = http.get(
          `http://localhost:8002/api/v1/product/category/${randomCategory.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        check(categoryProductsRes, {
          "category products retrieved": (r) => r.status === 200,
        });

        // View wishlist
        let wishlistRes = http.get("http://localhost:8004/api/v1/wishlist", {
          headers: { Authorization: `Bearer ${token}` },
        });

        check(wishlistRes, {
          "wishlist retrieved": (r) => r.status === 200,
        });
      }
    }
  });

  sleep(Math.random() * 3 + 1);
}

function purchaseFlow(token) {
  let productId = null;

  group("Shopping Flow", function () {
    // Get products
    let productsRes = http.get("http://localhost:8002/api/v1/product", {
      headers: { Authorization: `Bearer ${token}` },
    });

    check(productsRes, {
      "products retrieved": (r) => r.status === 200,
    });

    // Add product to cart
    if (productsRes.status === 200) {
      const products = JSON.parse(productsRes.body).data.products;
      if (products && products.length > 0) {
        const randomProduct = randomItem(products);
        productId = randomProduct.id;

        let addToCartRes = http.post(
          "http://localhost:8001/api/v1/cart",
          JSON.stringify({
            product_id: productId,
            quantity: 1,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        check(addToCartRes, {
          "product added to cart": (r) => r.status === 201,
        });

        // View cart
        let cartRes = http.get("http://localhost:8001/api/v1/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });

        check(cartRes, {
          "cart retrieved": (r) => r.status === 200,
        });

        // Place order
        let orderRes = http.post(
          "http://localhost:8001/api/v1/order",
          JSON.stringify({
            shipping_provider: "JNE",
          }),
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        check(orderRes, {
          "order placed": (r) => r.status === 201,
        });

        // Get order details
        if (orderRes.status === 201) {
          const order = JSON.parse(orderRes.body).order;

          let orderDetailsRes = http.get(
            `http://localhost:8001/api/v1/order/${order.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          check(orderDetailsRes, {
            "order details retrieved": (r) => r.status === 200,
          });
        }
      }
    }
  });

  sleep(Math.random() * 3 + 2);
}
