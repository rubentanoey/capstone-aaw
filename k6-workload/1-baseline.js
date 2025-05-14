import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 }, // Ramp up to 100 users
    { duration: "2m", target: 300 }, // Stay at 100 users
    { duration: "2m", target: 700 }, // Stay at 100 users
    { duration: "2m", target: 1000 }, // Stay at 100 users
    { duration: "2m", target: 2000 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests should be below 500ms
    http_req_failed: ["rate<0.01"], // Less than 1% of requests should fail
  },
};

export default function () {
  // User authentication
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

  check(loginRes, {
    "login successful": (r) => r.status === 200,
  });

  // Extract token
  let token = "";
  if (loginRes.status === 200) {
    token = JSON.parse(loginRes.body).token;
  }

  sleep(Math.random() * 3);

  if (token) {
    let productsRes = http.get(
      "http://Capstone-LB-1266500702.us-east-1.elb.amazonaws.com/api/v1/product?page_number=1&page_size=10",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    check(productsRes, {
      "products retrieved": (r) => r.status === 200,
    });

    console.log(`Products: ${productsRes.body}`);

    sleep(Math.random() * 2);
  }
}
