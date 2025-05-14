import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 }, // Initial low load for testing
    { duration: "2m", target: 300 }, // Ramp up to 100 users as a breakpoint
    { duration: "2m", target: 400 }, // Drop down to 50 users to test system under mid-load
    { duration: "2m", target: 1000 }, // Increase to 200 users for a stress test (another breakpoint)
    { duration: "2m", target: 19999 }, // Ramp down completely to test idle state
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests should be below 500ms
    http_req_failed: ["rate<0.01"], // Less than 1% of requests should fail
  },
};

export default function () {
  // User authentication
  let loginRes = http.post(
    "http://54.196.139.63:30001/api/v1/auth/login",
    JSON.stringify({
      username: "user${__VU}",
      password: "Password123",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  check(loginRes, {
    "login successful": (r) => r.status === 200,
  });

  // Extract token
  let token = "";
  if (loginRes.status === 200) {
    token = JSON.parse(loginRes.body).data.token;
  }

  sleep(Math.random() * 3);

  if (token) {
    let productsRes = http.get("http://54.196.139.63:30002/api/v1/product", {
      headers: { Authorization: `Bearer ${token}` },
    });

    check(productsRes, {
      "products retrieved": (r) => r.status === 200,
    });

    sleep(Math.random() * 2);
  }
}
