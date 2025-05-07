import { categories, Category } from "@db/schema/categories";
import { db } from "./db";
import { NewProduct, products } from "@db/schema/products";

const TENANT_ID = process.env.TENANT_ID;
if (!TENANT_ID) {
  console.log("T_ID is missing");
  throw new Error("TENANT_ID is missing");
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

  genProducts.map(async (product: NewProduct, i) => {
    console.log(`inserting category ${i}`);
    await db.insert(products).values(product);
  });

  console.log("Seeding completed");
}

main();
