import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema/**/*.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    host: process.env.DB_HOST ?? "db",
    port: (process.env.DB_PORT as number | undefined) ?? 5435,
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "postgres",
    database: process.env.DB_NAME ?? "marketplace",
  },
} satisfies Config;
