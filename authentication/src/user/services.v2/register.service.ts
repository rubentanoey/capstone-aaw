import bcrypt from "bcrypt";
import { NewUser } from "@db/schema/users";
import { insertNewUser } from "@src/user/dao/insertNewUser.dao";
import {
  InternalServerErrorResponse,
  ConflictResponse,
} from "@src/commons/patterns";

export const registerService = async (
  username: string,
  email: string,
  password: string,
  full_name: string,
  address: string,
  phone_number: string
) => {
  try {
    if (!process.env.TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant ID is missing"
      ).generate();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData: NewUser = {
      tenant_id: process.env.TENANT_ID,
      username,
      email,
      password: hashedPassword,
      full_name,
      address,
      phone_number,
    };

    const newUser = await insertNewUser(userData);

    return {
      data: newUser,
      status: 201,
    };
  } catch (err: any) {
    if (err.code === "23505") {
      if (err.detail?.includes("email")) {
        return new ConflictResponse({
          name: "ConflictError",
          message: "Email sudah digunakan",
        }).generate();
      }
      if (err.detail?.includes("username")) {
        return new ConflictResponse({
          name: "ConflictError",
          message: "Username sudah digunakan",
        }).generate();
      }
    }

    return new InternalServerErrorResponse(err).generate();
  }
};
