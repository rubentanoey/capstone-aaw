import { Request, Response, NextFunction } from "express";
import { UnauthenticatedResponse } from "../commons/patterns/exceptions";
import axios, { AxiosResponse } from "axios";
import { ServiceBreaker } from "../commons/patterns/circuit-breaker";

const verifyToken = async (token: string): Promise<AxiosResponse<any>> => {
  const authServiceUrl = process.env.AUTH_SERVICE_URL;
  if (!authServiceUrl) {
    throw new Error("Authentication service URL not configured");
  }
  
  return await axios.post(
    `${authServiceUrl}/auth/verify-admin-token`,
    { token }
  );
};

const fetchTenantData = async (tenantId: string, token: string): Promise<AxiosResponse<any>> => {
  const tenantServiceUrl = process.env.TENANT_SERVICE_URL;
  if (!tenantServiceUrl) {
    throw new Error("Tenant service URL not configured");
  }
  
  return await axios.get(
    `${tenantServiceUrl}/tenant/${tenantId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

const authServiceBreaker = new ServiceBreaker(
  verifyToken,
  'AuthService',
  { timeout: 3000, errorThresholdPercentage: 50 }
);

const tenantServiceBreaker = new ServiceBreaker(
  fetchTenantData,
  'TenantService',
  { timeout: 3000, errorThresholdPercentage: 50 }
);

authServiceBreaker.fallback(() => {
  throw new Error("Authentication service unavailable");
});

tenantServiceBreaker.fallback(() => {
  throw new Error("Tenant service unavailable");
});

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

    // Server tenant verification
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return res
        .status(400)
        .send({ message: "Server Tenant ID not configured" });
    }

    try {
      const verifiedPayload = await authServiceBreaker.fire(token);

      if (verifiedPayload.status !== 200 || !verifiedPayload.data) {
        return res.status(401).send({ message: "Invalid token" });
      }

      const tenantPayload = await tenantServiceBreaker.fire(SERVER_TENANT_ID, token);

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
    } catch (breakerError: any) {
      console.error("Circuit breaker error:", breakerError.message);
      return res
        .status(503)
        .send({ message: breakerError.message || "Service unavailable" });
    }
  } catch (error) {
    console.error("Error in verifyJWTProduct:", error);
    return res
      .status(401)
      .json(new UnauthenticatedResponse("Invalid token").generate());
  }
};
