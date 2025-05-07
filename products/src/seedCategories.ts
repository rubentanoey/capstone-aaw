import { NewCategory } from "@db/schema/categories";
import { db, pool } from "./db";
import * as schema from "@db/schema/categories";

const TENANT_ID = process.env.TENANT_ID;
if (!TENANT_ID) {
  console.log("T_ID is missing");
  throw new Error("TENANT_ID is missing");
}

export async function GenerateSeeds() {
  const genCategories = generateCategories();

  console.log("len: ", genCategories[0]);
  genCategories.map(async (category: NewCategory, i) => {
    console.log(`inserting category ${i}`);
    await db.insert(schema.categories).values(category);
  });
}

function generateCategories() {
  const categories: NewCategory[] = [];
  for (let i = 1; i <= 1000; i++) {
    const category: NewCategory = {
      name: `Category ${i}`,
      tenant_id: TENANT_ID!,
    };
    categories.push(category);
  }
  return categories;
}

async function main() {
  console.log("Start seeding");
  await GenerateSeeds();
  console.log("Seeding completed");
  pool.end();
}

main();
