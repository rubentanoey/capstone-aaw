import { cart, NewCart } from "@db/schema/cart";
import { NewOrder, order } from "@db/schema/order";
import { db, pool } from "./db";

const TENANT_ID = process.env.TENANT_ID;
const DUMMY_USER_ID = process.env.DUMMY_USER_ID;
const DUMMY_PRODUCT_ID = process.env.DUMMY_PRODUCT_ID;
const DUMMY_PRODUCT_PRICE = process.env.DUMMY_PRODUCT_PRICE;
if (!TENANT_ID || !DUMMY_USER_ID || !DUMMY_PRODUCT_ID || !DUMMY_PRODUCT_PRICE) {
  throw new Error("TENANT_ID or DUMMY_USER_ID or DUMMY_PRODUCT_ID not found");
}

async function seedCart() {
  const quantity = Math.floor(Math.random() * 5) + 1;
  const newCart: NewCart = {
    product_id: DUMMY_PRODUCT_ID!,
    quantity: quantity,
    tenant_id: TENANT_ID!,
    user_id: DUMMY_USER_ID!,
  };
  await db.insert(cart).values(newCart);

  const newOrder: NewOrder = {
    shipping_provider: "GOSEND",
    total_amount: parseInt(DUMMY_PRODUCT_PRICE!) * quantity,
    tenant_id: TENANT_ID!,
    user_id: DUMMY_USER_ID!,
  };

  await db.insert(order).values(newOrder);
}

async function main() {
  console.log("Start seeding");

  for (let i = 0; i < 256; i++) {
    await seedCart();
  }
  console.log("Seeding completed");
  pool.end();
}

main();
