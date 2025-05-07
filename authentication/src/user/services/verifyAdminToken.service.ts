import {
  InternalServerErrorResponse,
  UnauthorizedResponse,
  NotFoundResponse,
} from "@src/commons/patterns";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getUserById } from "@src/user/dao/getUserById.dao";

export const verifyAdminTokenService = async (token: string) => {
  try {
    const SERVER_TENANT_ID = process.env.ADMIN_TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse("Server tenant ID is missing", {
        code: "MISSING_TENANT_ID",
      }).generate();
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(
        token,
        process.env.ADMIN_JWT_SECRET as string
      ) as JwtPayload;
    } catch (jwtError) {
      return new UnauthorizedResponse("Invalid or expired token", {
        code: "INVALID_TOKEN",
      }).generate();
    }

    const { id, tenant_id } = payload;

    if (tenant_id !== SERVER_TENANT_ID) {
      return new UnauthorizedResponse("Invalid tenant ID", {
        code: "INVALID_TENANT",
      }).generate();
    }

    const user = await getUserById(id, SERVER_TENANT_ID);
    if (!user) {
      return new NotFoundResponse("User not found", {
        code: "USER_NOT_FOUND",
      }).generate();
    }

    return {
      data: {
        user,
      },
      status: 200,
    };
  } catch (err: unknown) {
    console.error("Verify admin token service error:", err);

    if (err instanceof Error) {
      return new InternalServerErrorResponse(err.message, {
        code: "TOKEN_VERIFICATION_ERROR",
        includeStack: process.env.NODE_ENV !== "production",
      }).generate();
    }

    return new InternalServerErrorResponse("An unknown error occurred", {
      code: "UNKNOWN_ERROR",
      includeStack: process.env.NODE_ENV !== "production",
    }).generate();
  }
};
