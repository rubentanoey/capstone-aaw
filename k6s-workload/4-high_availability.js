import http from "k6/http";
import { check, sleep, group } from "k6";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
  scenarios: {
    normal_load: {
      executor: "constant-vus",
      vus: 20,
      duration: "30m",
    },
    spike_load: {
      executor: "ramping-arrival-rate",
      startRate: 0,
      timeUnit: "1s",
      preAllocatedVUs: 100,
      stages: [
        // Spike every 5 minutes
        { duration: "5m", target: 1 }, // Low rate
        { duration: "30s", target: 50 }, // Spike!
        { duration: "1m", target: 1 }, // Recovery

        { duration: "5m", target: 1 },
        { duration: "30s", target: 50 },
        { duration: "1m", target: 1 },

        { duration: "5m", target: 1 },
        { duration: "30s", target: 50 },
        { duration: "1m", target: 1 },
      ],
    },
  },
  thresholds: {
    "http_req_duration{scenario:normal_load}": ["p(95)<500"],
    "http_req_duration{scenario:spike_load}": ["p(95)<1500"],
    "http_req_failed{scenario:normal_load}": ["rate<0.01"],
    "http_req_failed{scenario:spike_load}": ["rate<0.05"],
  },
};

export default function () {
  // Run different test patterns based on scenario
  if (__ENV.SCENARIO === "spike_load") {
    // During spikes, run more aggressive tests of crucial paths
    criticalPathTest();
  } else {
    // Normal load with full user journey
    fullUserJourney();
  }
}

function fullUserJourney() {
  // Authentication
  let token = null;

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

    if (loginRes.status === 200) {
      token = JSON.parse(loginRes.body).data.token;
    }
  });

  if (!token) return;

  // Tenant information
  group("Tenant Details", function () {
    http.get(
      "http://localhost:8003/api/v1/tenant/550e8400-e29b-41d4-a716-446655440000",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  });

  // Product browsing
  let productId = null;

  group("Product Browsing", function () {
    let productsRes = http.get("http://localhost:8002/api/v1/product", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (productsRes.status === 200) {
      const products = JSON.parse(productsRes.body).data.products;
      if (products && products.length > 0) {
        productId = products[0].id;

        http.get(`http://localhost:8002/api/v1/product/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }
  });

  // Cart and order operations
  if (productId) {
    group("Shopping", function () {
      http.post(
        "http://localhost:8001/api/v1/cart",
        JSON.stringify({
          product_id: productId,
          quantity: randomIntBetween(1, 3),
        }),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      http.get("http://localhost:8001/api/v1/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Place order sometimes (not every user will complete purchase)
      if (Math.random() < 0.3) {
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

        if (orderRes.status === 201) {
          const order = JSON.parse(orderRes.body).order;

          // View order details
          http.get(`http://localhost:8001/api/v1/order/${order.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
    });
  }

  sleep(Math.random() * 3 + 2);
}

function criticalPathTest() {
  // Focus on the most critical business paths
  // This runs during spike tests to verify system stability

  // 1. Authentication - this is critical for all operations
  let token = null;
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

  check(loginRes, {
    "login successful during spike": (r) => r.status === 200,
  });

  if (loginRes.status === 200) {
    token = JSON.parse(loginRes.body).data.token;
  } else {
    return; // Can't proceed without token
  }

  // 2. Product listing - critical for browsing
  let productsRes = http.get("http://localhost:8002/api/v1/product", {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(productsRes, {
    "products retrieved during spike": (r) => r.status === 200,
  });

  // 3. Cart operations - critical for purchases
  http.get("http://localhost:8001/api/v1/cart", {
    headers: { Authorization: `Bearer ${token}` },
  });

  sleep(Math.random() * 1 + 0.5); // Shorter sleep during spikes for more load
}
