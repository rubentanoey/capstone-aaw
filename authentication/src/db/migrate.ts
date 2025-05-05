import dotenv from "dotenv";
dotenv.config();

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index";

const main = async () => {
  console.log("Running migrations...");
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
};

main().catch(console.error);
