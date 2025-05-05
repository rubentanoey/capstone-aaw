import { Request, Response, NextFunction } from "express";
import { UnauthenticatedResponse } from "../commons/patterns/exceptions";
import axios from "axios";

export const verifyJWTProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // JWT verification

    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).send({ message: "Token is required" });
    }

    const authServiceUrl = process.env.AUTH_SERVICE_URL;
    if (!authServiceUrl) {
      return res
        .status(500)
        .send({ message: "Authentication service URL not configured" });
    }

    const verifiedPayload = await axios.post(
      `${authServiceUrl}/auth/verify-admin-token`,
      {
        token,
      }
    );

    if (verifiedPayload.status !== 200 || !verifiedPayload.data) {
      return res.status(401).send({ message: "Invalid token" });
    }

    // Tenant verification

    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return res
        .status(400)
        .send({ message: "Server Tenant ID not configured" });
    }

    const tenantServiceUrl = process.env.TENANT_SERVICE_URL;
    if (!tenantServiceUrl) {
      return res
        .status(500)
        .send({ message: "Tenant service URL not configured" });
    }

    const tenantPayload = await axios.get(
      `${tenantServiceUrl}/tenant/${SERVER_TENANT_ID}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (tenantPayload.status !== 200 || !tenantPayload.data) {
      return res
        .status(400)
        .send({ message: "Tenant data not found or invalid" });
    }

    const verifiedTenantPayload = tenantPayload.data as {
      tenants: {
        id: string;
        owner_id: string;
      };
      tenantDetails: {
        id: string;
        tenant_id: string;
        name: string;
      };
    };

    if (
      verifiedPayload.data.user.id !== verifiedTenantPayload.tenants.owner_id
    ) {
      return res
        .status(401)
        .send({ message: "Unauthorized: User does not own the tenant" });
    }

    req.body.user = verifiedPayload.data.user;
    next();
  } catch (error) {
    console.error("Error in verifyJWTProduct:", error);
    return res
      .status(401)
      .json(new UnauthenticatedResponse("Invalid token").generate());
  }
};
