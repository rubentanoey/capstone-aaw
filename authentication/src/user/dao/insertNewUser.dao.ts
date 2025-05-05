import { NewUser } from "@db/schema/users";
import * as schema from "@db/schema/users";
import { db } from "@src/db";

export const insertNewUser = async (data: NewUser) => {
  console.log("insertNewUser data", data);
  console.log("insertNewUser db", db);
  const result = await db.insert(schema.users).values(data).returning({
    id: schema.users.id,
    username: schema.users.username,
    email: schema.users.email,
    full_name: schema.users.full_name,
    address: schema.users.address,
    phone_number: schema.users.phone_number,
  });
  console.log("insertNewUser result", result);
  return result;
};
