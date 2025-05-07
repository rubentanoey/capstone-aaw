import bcrypt from "bcrypt";
import { NewUser } from "@db/schema/users";
import { insertNewUser } from "@src/user/dao/insertNewUser.dao";
import { 
  InternalServerErrorResponse,
  BadRequestResponse
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
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse("Server tenant ID is missing", {
        code: "MISSING_TENANT_ID",
      }).generate();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData: NewUser = {
      tenant_id: SERVER_TENANT_ID,
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
  } catch (err: unknown) {
    console.error("Registration service error:", err);
    
    if (err instanceof Error) {
      if (err.message.includes("duplicate")) {
        return new BadRequestResponse("User already exists", {
          code: "USER_ALREADY_EXISTS",
          includeStack: process.env.NODE_ENV !== "production",
        }).generate();
      }
      
      return new InternalServerErrorResponse(err.message, {
        code: "REGISTRATION_ERROR",
        includeStack: process.env.NODE_ENV !== "production",
      }).generate();
    }
    
    return new InternalServerErrorResponse("An unknown error occurred", {
      code: "UNKNOWN_ERROR",
      includeStack: process.env.NODE_ENV !== "production",
    }).generate();
  }
};