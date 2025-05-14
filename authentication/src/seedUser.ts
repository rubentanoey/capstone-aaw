import { NewUser, users } from "@db/schema/users";
import { db, pool } from "./db";
import bcrypt from "bcryptjs";

const DUMMY_USER_ID = process.env.DUMMY_USER_ID;
if (!DUMMY_USER_ID) {
  throw new Error("TENANT_ID or DUMMY_USER_ID or DUMMY_PRODUCT_ID not found");
}

async function generateUser() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("seedingpassword", salt);

  const newUser: NewUser = {
    id: DUMMY_USER_ID,
    email: "seed@gmail.com",
    password: hashedPassword,
    username: "seedinguser",
  };

  await db.insert(users).values(newUser);
}

async function main() {
  console.log("Start seeding");
  await generateUser();
  console.log("Seeding completed");
  pool.end();
}

main();
