import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 }, // Ramp up to 100 users
    { duration: "5m", target: 100 }, // Stay at 100 users
    { duration: "2m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests should be below 500ms
    http_req_failed: ["rate<0.01"], // Less than 1% of requests should fail
  },
};

export default function () {
  // User authentication
  let loginRes = http.post(
    "http://54.237.195.212:30001/api/v1/auth/login",
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
    let productsRes = http.get("http://54.237.195.212:8002/api/v1/product", {
      headers: { Authorization: `Bearer ${token}` },
    });

    check(productsRes, {
      "products retrieved": (r) => r.status === 200,
    });

    sleep(Math.random() * 2);
  }
}
