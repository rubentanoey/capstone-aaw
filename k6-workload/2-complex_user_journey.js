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

  if (__ITER % 3 === 0) {
    purchaseFlow(token);
  } else {
    purchaseFlow(token);
    // browsingFlow(token);
  }
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

function browsingFlow(token) {
  group("Product Browsing", function () {
    // Get all categories
    let categoriesRes = http.get(
      "http://Capstone-LB-1266500702.us-east-1.elb.amazonaws.com/api/v1/product/category?page_number=1&page_size=10"
    );

    check(categoriesRes, {
      "categories retrieved": (r) => r.status === 200,
    });

    if (categoriesRes.status === 200) {
      const categories = JSON.parse(categoriesRes.body).categories;

      if (categories && categories.length > 0) {
        const randomCategory = randomItem(categories);

        // Get exact category
        let categoryProductsRes = http.get(
          `http://Capstone-LB-1266500702.us-east-1.elb.amazonaws.com/api/v1/product/category/${randomCategory.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        check(categoryProductsRes, {
          "category products retrieved": (r) => r.status === 200,
        });

        const products = JSON.parse(categoryProductsRes.body).products;

        if (products && products.length > 0) {
          const randomCount = Math.floor(Math.random() * products.length) + 1;
          const randomProducts = [];
          for (let i = 0; i < randomCount; i++) {
            const randomProduct = randomItem(products);
            randomProducts.push(randomProduct.id);
          }

          // Get products
          let productsRes = http.post(
            "http://Capstone-LB-1266500702.us-east-1.elb.amazonaws.com/api/v1/product/many",
            JSON.stringify({
              productIds: randomProducts,
            }),
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          check(productsRes, {
            "product details retrieved": (r) => r.status === 200,
          });

          // Create new wishlist
          let createWishlistRes = http.post(
            "http://Capstone-LB-1266500702.us-east-1.elb.amazonaws.com/api/v1/wishlist",
            JSON.stringify({
              name: "My Wishlist",
            }),
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          check(createWishlistRes, {
            "wishlist created": (r) => r.status === 201,
          });

          const wishlistId = JSON.parse(createWishlistRes.body).id;

          // Add products to wishlist
          for (let i = 0; i < randomCount; i++) {
            let addToWishlistRes = http.post(
              "http://Capstone-LB-1266500702.us-east-1.elb.amazonaws.com/api/v1/wishlist/add",
              JSON.stringify({
                wishlist_id: wishlistId,
                product_id: randomProducts[i],
              }),
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            check(addToWishlistRes, {
              "products added to wishlist": (r) => r.status === 200,
            });
          }

          // Get wishlist
          let wishlistRes = http.get(
            "http://Capstone-LB-1266500702.us-east-1.elb.amazonaws.com/api/v1/wishlist?page_number=1&page_size=10",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          check(wishlistRes, {
            "wishlist retrieved": (r) => r.status === 200,
          });
        }
      }
    }
  });

  sleep(Math.random() * 3 + 1);
}

function purchaseFlow(token) {
  let productId = null;

  group("Shopping Flow", function () {
    // Get products
    const randomNumber = Math.floor(Math.random() * 90) + 1;
    const randomSize = Math.floor(Math.random() * 90) + 1;

    let productsRes = http.get(
      `http://Capstone-LB-1266500702.us-east-1.elb.amazonaws.com/api/v1/product?page_number=${randomNumber}&page_size=${randomSize}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    check(productsRes, {
      "products retrieved": (r) => r.status === 200,
    });

    // Add product to cart
    if (productsRes.status === 200) {
      const products = JSON.parse(productsRes.body).products;

      if (products && products.length > 0) {
        // Randomly select some products
        const randomCount = Math.floor(Math.random() * products.length) + 1;
        const randomProducts = [];
        for (let i = 0; i < randomCount; i++) {
          const randomProduct = randomItem(products);
          randomProducts.push(randomProduct.id);
        }

        // iter over the random products to add to cart

        for (let i = 0; i < randomCount; i++) {
          productId = randomProducts[i];

          let addToCartRes = http.post(
            "http://Capstone-LB-1266500702.us-east-1.elb.amazonaws.com/api/v1/cart",
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
        }

        // View cart
        let cartRes = http.get(
          "http://Capstone-LB-1266500702.us-east-1.elb.amazonaws.com/api/v1/cart?page_number=1&page_size=10",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        check(cartRes, {
          "cart retrieved": (r) => r.status === 200,
        });

        // Place order
        let orderRes = http.post(
          "http://Capstone-LB-1266500702.us-east-1.elb.amazonaws.com/api/v1/order",
          JSON.stringify({
            shipping_provider: "TIKI",
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
            `http://Capstone-LB-1266500702.us-east-1.elb.amazonaws.com/api/v1/order/${order.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          check(orderDetailsRes, {
            "order details retrieved": (r) => r.status === 200,
          });

          console.log(`Order details: ${orderDetailsRes.body}`);

          if (orderDetailsRes.status === 200) {
            const orderId = JSON.parse(orderDetailsRes.body).order_id;
            const orderPrice = JSON.parse(orderDetailsRes.body).unit_price;
            const orderQuantity = JSON.parse(orderDetailsRes.body).quantity;

            // Pay for order
            let payOrderRes = http.post(
              `http://Capstone-LB-1266500702.us-east-1.elb.amazonaws.com/api/v1/order/${orderId}/pay`,
              JSON.stringify({
                payment_method: "BCA",
                payment_reference: "1234567890",
                amount: orderPrice * orderQuantity,
              }),
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            check(payOrderRes, {
              "order paid": (r) => r.status === 200,
            });

            console.log(
              `Order ${payOrderRes.body}. Order ID: ${orderId}, Amount: ${orderPrice}`
            );
          }
        }
      }
    }
  });

  sleep(Math.random() * 3 + 2);
}
