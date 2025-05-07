import { NewUser, users } from "@db/schema/users";
import { db, pool } from "./db";

async function generateUser() {
  const newUser: NewUser = {
    id: "619ddb3e-0167-4b43-ad5d-d76b193dea42",
    email: "seed@gmail.com",
    password: "seedingpassword",
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
