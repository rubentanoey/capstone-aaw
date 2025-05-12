import { categories, Category } from "@db/schema/categories";
import { db, pool } from "./db";
import { NewProduct, products } from "@db/schema/products";

const TENANT_ID = process.env.TENANT_ID;
const DUMMY_PRODUCT_ID = process.env.DUMMY_PRODUCT_ID;
if (!TENANT_ID || !DUMMY_PRODUCT_ID) {
  console.log("TENANT_ID or PRODUCT_ID is missing");
  throw new Error("TENANT_ID or PRODUCT_ID is missing");
}

function generateProucts(categories: Category[]) {
  const products: NewProduct[] = [];
  for (let i = 1; i <= 8192; i++) {
    const randomNumber = Math.floor(Math.random() * 1000);
    const product: NewProduct = {
      name: `Product ${i}`,
      price: Math.floor(Math.random() * 10000) + 1000,
      quantity_available: Math.floor(Math.random() * 10) + 1,
      category_id: categories[randomNumber].id,
      tenant_id: TENANT_ID!,
    };
    products.push(product);
  }
  return products;
}

async function main() {
  console.log("Start seeding");

  const validCategories = await db.select().from(categories);
  console.log(validCategories.length);

  const genProducts = generateProucts(validCategories);

  const inserting = genProducts.map(async (product: NewProduct, i) => {
    console.log(`inserting product ${i}`);
    await db.insert(products).values(product);
  });

  await Promise.all(inserting);

  const dummyProduct: NewProduct = {
    name: `Dummy Product`,
    price: Math.floor(Math.random() * 10000) + 1000,
    quantity_available: Math.floor(Math.random() * 10) + 1,
    category_id: validCategories[0].id,
    tenant_id: TENANT_ID!,
    id: DUMMY_PRODUCT_ID,
  };

  await db.insert(products).values(dummyProduct);

  console.log("Seeding completed");
  // pool.end();
}

main();
