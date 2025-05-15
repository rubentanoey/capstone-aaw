import { Request, Response, NextFunction } from "express";
import axios, { AxiosResponse } from "axios";
import { UnauthenticatedResponse } from "../commons/patterns/exceptions";
import { ServiceBreaker } from "../commons/patterns/circuit-breaker";

const verifyToken = async (token: string): Promise<AxiosResponse<any>> => {
  const authServiceUrl = process.env.AUTH_SERVICE_URL;
  if (!authServiceUrl) {
    throw new Error("Authentication service URL not configured");
  }

  return await axios.post(`${authServiceUrl}/auth/verify-admin-token`, {
    token,
  });
};

const authServiceBreaker = new ServiceBreaker(verifyToken, "AuthService", {
  timeout: 3000,
  errorThresholdPercentage: 50,
});

authServiceBreaker.fallback((debug: any) => {
  console.log("error: ", debug);
  throw new Error("Authentication service unavailable");
});

export const verifyJWTTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).send({ message: "No token provided" });
    }

    const authServiceUrl = process.env.AUTH_SERVICE_URL;
    if (!authServiceUrl) {
      return res
        .status(500)
        .send({ message: "Authentication service URL not configured" });
    }

    try {
      const response = await authServiceBreaker.fire(token);

      if (response.status !== 200 || !response.data) {
        return res.status(401).send({ message: "Invalid token" });
      }

      const verifiedPayload = response.data;

      req.body.user = verifiedPayload.user;
      next();
    } catch (breakerError: any) {
      console.error("Circuit breaker error:", breakerError.message);
      return res
        .status(503)
        .send({ message: breakerError.message || "Service unavailable" });
    }
  } catch (error) {
    console.error("Error in verifyJWTTenant:", error);
    return res
      .status(401)
      .json(new UnauthenticatedResponse("Invalid token").generate());
  }
};
