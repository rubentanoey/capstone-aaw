import { NewUser, users } from "@db/schema/users";
import bcrypt from "bcryptjs";
import { db } from "./db";

const DUMMY_USER_ID = process.env.DUMMY_USER_ID;
if (!DUMMY_USER_ID) {
  throw new Error("DUMMY_USER_ID not found");
}
const SERVER_TENANT_ID = process.env.TENANT_ID;
if (!SERVER_TENANT_ID) {
  throw new Error("TENANT_ID not found");
}

async function generateUser() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("seedingpassword", salt);

  const newUser: NewUser = {
    id: DUMMY_USER_ID,
    email: "seed@gmail.com",
    password: hashedPassword,
    username: "seedinguser",
    tenant_id: SERVER_TENANT_ID,
  };

  // registerService(
  //   newUser.id!,
  //   newUser.username,
  //   newUser.email,
  //   newUser.password,
  //   "",
  //   "",
  //   ""
  // );
  await db.insert(users).values(newUser);
}

async function main() {
  console.log("Start seeding");
  await generateUser();
  console.log("Seeding completed");
  // pool.end();
}

main();
