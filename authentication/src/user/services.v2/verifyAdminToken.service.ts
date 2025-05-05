import {
  InternalServerErrorResponse,
  UnauthorizedResponse,
} from "@src/commons/patterns";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getUserById } from "@src/user/dao/getUserById.dao";

export const verifyAdminTokenService = async (token: string) => {
  try {
    const adminJwtSecret = process.env.ADMIN_JWT_SECRET as string;
    if (!adminJwtSecret) {
      return new InternalServerErrorResponse(
        "Admin JWT secret is missing"
      ).generate();
    }

    const payload = jwt.verify(token, adminJwtSecret) as JwtPayload;

    const { id, tenant_id } = payload;
    if (!id || !tenant_id) {
      return new UnauthorizedResponse("Invalid token format").generate();
    }

    const SERVER_TENANT_ID = process.env.ADMIN_TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server admin tenant ID is missing"
      ).generate();
    }

    if (tenant_id !== SERVER_TENANT_ID) {
      return new UnauthorizedResponse("Invalid tenant ID").generate();
    }

    const user = await getUserById(id, SERVER_TENANT_ID);
    if (!user) {
      return new UnauthorizedResponse("User not found").generate();
    }

    return {
      data: {
        user,
      },
      status: 200,
    };
  } catch (err: any) {
    if (err.name === "JsonWebTokenError") {
      return new UnauthorizedResponse("Invalid token signature").generate();
    }
    if (err.name === "TokenExpiredError") {
      return new UnauthorizedResponse("Token has expired").generate();
    }
    if (err.name === "NotBeforeError") {
      return new UnauthorizedResponse("Token not yet active").generate();
    }

    return new UnauthorizedResponse("Authentication failed").generate();
  }
};
