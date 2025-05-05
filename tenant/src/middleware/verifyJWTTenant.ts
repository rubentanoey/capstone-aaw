import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { UnauthenticatedResponse } from "../commons/patterns/exceptions";

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

    const response = await axios.post(
      `${authServiceUrl}/auth/verify-admin-token`,
      {
        token,
      }
    );

    console.log("response", response);

    if (response.status !== 200 || !response.data) {
      return res.status(401).send({ message: "Invalid token" });
    }

    const verifiedPayload = response.data;

    req.body.user = verifiedPayload.user;
    next();
  } catch (error) {
    console.error("Error in verifyJWTTenant:", error);
    return res
      .status(401)
      .json(new UnauthenticatedResponse("Invalid token").generate());
  }
};
