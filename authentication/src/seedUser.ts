import { NewUser } from "@db/schema/users";
import { registerService } from "./user/services";

const DUMMY_USER_ID = process.env.DUMMY_USER_ID;
if (!DUMMY_USER_ID) {
  throw new Error("TENANT_ID or DUMMY_USER_ID or DUMMY_PRODUCT_ID not found");
}

async function generateUser() {
  const newUser: NewUser = {
    id: DUMMY_USER_ID,
    email: "seed@gmail.com",
    password: "seedingpassword",
    username: "seedinguser",
  };

  registerService(
    newUser.username,
    newUser.email,
    newUser.password,
    "",
    "",
    ""
  );
  // await db.insert(users).values(newUser);
}

async function main() {
  console.log("Start seeding");
  await generateUser();
  console.log("Seeding completed");
  // pool.end();
}

main();
