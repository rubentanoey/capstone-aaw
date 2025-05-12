import {
  InternalServerErrorResponse,
  NotFoundResponse,
} from "@src/commons/patterns";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

import { getUserByUsername } from "../src/user/dao/getUserByUsername.dao";
import { NewUser, User } from "../db/schema/users";
import { insertNewUser } from "../src/user/dao/insertNewUser.dao";

export const GenerateAdminToken = async (
  username: string,
  password: string
) => {
  try {
    const SERVER_TENANT_ID = process.env.ADMIN_TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant ID is missing"
      ).generate();
    }
    const user: User = await getUserByUsername(username, SERVER_TENANT_ID);
    if (!user) {
      return new NotFoundResponse("User not found").generate();
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return new NotFoundResponse("Invalid password").generate();
    }

    const payload = {
      id: user.id,
      tenant_id: user.tenant_id,
    };
    const secret: string = process.env.ADMIN_JWT_SECRET as string;
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
    return new InternalServerErrorResponse(err).generate();
  }
};

const registerAdmin = async (
  username: string,
  email: string,
  password: string,
  full_name: string,
  address: string,
  phone_number: string
) => {
  const SERVER_TENANT_ID = process.env.ADMIN_TENANT_ID;
  if (!SERVER_TENANT_ID) {
    return new InternalServerErrorResponse(
      "Server tenant ID is missing"
    ).generate();
  }

  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password, salt);

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
};

async function getAdminExistence() {
  if (!process.env.ADMIN_TENANT_ID) {
    throw new Error("ADMIN_TENANT_ID is missing");
  }

  if (!process.env.ADMIN_JWT_SECRET) {
    throw new Error("ADMIN_JWT_SECRET is missing");
  }

  console.log(await getUserByUsername("admin", process.env.ADMIN_TENANT_ID));
  return !!(await getUserByUsername("admin", process.env.ADMIN_TENANT_ID));
}

(async () => {
  if (await getAdminExistence()) {
    console.log("Admin already exists");
  } else {
    await registerAdmin(
      "admin",
      "admin@admin.com",
      "Admin123",
      "admin",
      "admin",
      "admin"
    );
  }
})();

(async () => {
  console.log(await GenerateAdminToken("admin", "Admin123"));
})();
