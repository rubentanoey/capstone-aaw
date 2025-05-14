import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUserByUsername } from "../dao/getUserByUsername.dao";

import {
  InternalServerErrorResponse,
  NotFoundResponse,
  UnauthenticatedResponse,
} from "@src/commons/patterns";
import { User } from "@db/schema/users";

export const loginService = async (username: string, password: string) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse("Server tenant ID is missing", {
        code: "MISSING_TENANT_ID",
      }).generate();
    }

    const user: User = await getUserByUsername(username, SERVER_TENANT_ID);
    if (!user) {
      return new NotFoundResponse("User not found", {
        code: "USER_NOT_FOUND",
      }).generate();
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return new UnauthenticatedResponse("Invalid credentials", {
        code: "INVALID_CREDENTIALS",
      }).generate();
    }

    const payload = {
      id: user.id,
      tenant_id: user.tenant_id,
    };
    const secret: string = process.env.JWT_SECRET as string;
    const token = jwt.sign(payload, secret, {
      expiresIn: "1d",
    });

    return {
      data: {
        token,
      },
      status: 200,
    };
  } catch (err: any) {
    console.error("Login service error:", err);
    throw err;
  }
};
