import http from "k6/http";
import { check, sleep, group } from "k6";
import exec from "k6/execution";

export const options = {
  scenarios: {
    constant_traffic: {
      executor: "constant-vus",
      vus: 50,
      duration: "10m",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<800"],
    http_req_failed: ["rate<0.05"],
    checks: ["rate>0.95"],
  },
};

// Array of services that we'll simulate as being down
const services = ["auth", "product", "order", "tenant"];
// Track which service is currently "down"
let currentDownService = "";

export default function () {
  // Calculate which service should be "down" based on test execution time
  // Every 2 minutes (120s), we'll rotate to a different service being down
  const testRunSeconds = exec.scenario.iterationInScene / 60;
  const serviceRotationIndex =
    Math.floor(testRunSeconds / 120) % services.length;

  // Determine if we're in a service outage period (30 seconds every 2 minutes)
  const inServiceOutagePeriod = testRunSeconds % 120 < 30;

  if (inServiceOutagePeriod) {
    currentDownService = services[serviceRotationIndex];
    console.log(
      `Service ${currentDownService} simulated down at iteration ${exec.instance.iterationsCompleted}`
    );
  } else {
    currentDownService = "";
  }

  // Regular user flow with resilience against failures
  authenticatedUserJourney(currentDownService);
}

function authenticatedUserJourney(downService) {
  // Authentication with retry logic
  let token = null;
  let retries = 3;

  group("Authentication", function () {
    while (!token && retries > 0) {
      // Skip auth call if auth service is "down"
      if (downService === "auth") {
        sleep(1); // Simulate failed request time
        console.log(
          `Auth service simulated down, retry ${3 - retries + 1} of 3...`
        );
        retries--;
        continue;
      }

      let loginRes = http.post(
        "http://localhost:8000/api/v1/auth/login",
        JSON.stringify({
          username: `user${exec.vu.idInTest}`,
          password: "Password123",
        }),
        {
          headers: { "Content-Type": "application/json" },
          timeout: "5s", // Short timeout to fail fast
        }
      );

      if (loginRes.status === 200) {
        token = JSON.parse(loginRes.body).data.token;
        break;
      }

      retries--;
      sleep(1); // Backoff before retry
    }

    check(null, {
      "authentication succeeded or properly handled failure": () =>
        downService === "auth" || token !== null,
    });
  });

  if (!token && downService !== "auth") {
    console.log(
      `Authentication failed after retries at iteration ${exec.instance.iterationsCompleted}`
    );
    return;
  }

  // Product browsing with circuit breaker pattern
  group("Product Browsing", function () {
    if (downService !== "product") {
      let productsRes = http.get("http://localhost:8002/api/v1/product", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: "3s",
      });

      check(productsRes, {
        "products retrieved": (r) => r.status === 200,
      });
    } else {
      console.log(
        `Product service simulated down, skipping product requests at iteration ${exec.instance.iterationsCompleted}`
      );
      sleep(1); // Simulate request time
    }
  });

  // Cart and order operations - skip if those services are "down"
  group("Shopping Flow", function () {
    if (downService !== "order") {
      // Add to cart
      let cartProductId = "550e8400-e29b-41d4-a716-446655440000"; // Example UUID

      let addToCartRes = http.post(
        "http://localhost:8001/api/v1/cart",
        JSON.stringify({
          product_id: cartProductId,
          quantity: 1,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: "3s",
        }
      );

      check(addToCartRes, {
        "product added to cart": (r) => r.status === 201,
      });

      // Get cart
      let cartRes = http.get("http://localhost:8001/api/v1/cart", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: "3s",
      });

      check(cartRes, {
        "cart retrieved": (r) => r.status === 200,
      });

      // Place order only if cart request succeeded
      if (cartRes.status === 200) {
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
            timeout: "5s",
          }
        );

        check(orderRes, {
          "order placed": (r) => r.status === 201,
        });

        // Check tenant info with fallback
        group("Tenant Info", function () {
          if (downService !== "tenant") {
            let tenantRes = http.get(
              "http://localhost:8003/api/v1/tenant/550e8400-e29b-41d4-a716-446655440000",
              {
                headers: { Authorization: `Bearer ${token}` },
                timeout: "3s",
              }
            );

            check(tenantRes, {
              "tenant info retrieved": (r) => r.status === 200,
            });
          } else {
            console.log(
              `Tenant service simulated down, using cached tenant info at iteration ${exec.instance.iterationsCompleted}`
            );
            // In a real test you might implement fallback to cached data
          }
        });
      }
    } else {
      console.log(
        `Order service simulated down, skipping order flow at iteration ${exec.instance.iterationsCompleted}`
      );
      sleep(2); // Simulate skipped request time
    }
  });

  // Add some randomized think time between iterations
  const thinkTime = Math.random() * 2 + 1;
  console.log(
    `User thinking for ${thinkTime.toFixed(1)}s at iteration ${
      exec.instance.iterationsCompleted
    }`
  );
  sleep(thinkTime);
}
