import bcrypt from "bcrypt";
import { NewUser } from "@db/schema/users";
import { insertNewUser } from "@src/user/dao/insertNewUser.dao";
import { InternalServerErrorResponse } from "@src/commons/patterns";

export const registerService = async (
  username: string,
  email: string,
  password: string,
  full_name: string,
  address: string,
  phone_number: string
) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (!process.env.TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant ID is missing"
      ).generate();
    }

    const userData: NewUser = {
      tenant_id: process.env.TENANT_ID,
      username,
      email,
      password: hashedPassword,
      full_name,
      address,
      phone_number,
    };
    console.log("userData===>", userData);
    const newUser = await insertNewUser(userData);

    return {
      data: newUser,
      status: 201,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
