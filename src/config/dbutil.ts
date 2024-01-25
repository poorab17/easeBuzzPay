// databaseUtil.ts
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response } from "express";
import knex from "knex";

require("dotenv").config();

interface DecodedToken extends JwtPayload {
  state: string;
}

export const authenticateToken = (
  req: Request,
  res: Response
): DecodedToken => {
  // const tokens = req.cookies.jwtToken;
  const token = req?.headers?.authorization?.split(" ")[1];
  // console.log(token, req?.headers?.authorization, "token jwt");

  if (!token) {
    res.status(401).json({ message: "JWT token is missing." });
    throw new Error("JWT token is missing.");
  }

  const decoded = jwt.verify(
    token,
    `${process.env.SECRET_KEY}`
  ) as DecodedToken;

  if (!decoded) {
    res
      .status(403)
      .json({ message: "Access denied. Insufficient privileges." });
    throw new Error("Access denied. Insufficient privileges.");
  }

  return decoded;
};

export const connectToDatabase = async (state: string) => {
  // const state = decoded.state;
  console.log(state, "state");
  const dbName = state?.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");

  const tenantDB = knex({
    client: process.env.CLIENT_LOCAL,
    connection: {
      host: process.env.HOST_IP,
      user: process.env.USER_LOCAL,
      password: process.env.PASSWORD_LOCAL,
      database: `${dbName}`,
    },
  });

  // Check if the specified database exists
  const databaseExists = await tenantDB.raw(
    `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
    [state]
  );

  if (!databaseExists.length) {
    throw new Error(`Database '${state}' does not exist.`);
  }

  await tenantDB.raw("SELECT 1");
  console.log("Tenant Database connected successfully");

  return tenantDB;
};

// -- TO QUERY THE DB RELATED TO IT'S COMING STATE FROM USER -------------------------------------------
export const findAndConnectToStateDB = async (state: string) => {
  const queryState = knex({
    client: process.env.CLIENT_LOCAL,
    connection: {
      host: process.env.HOST_IP,
      user: process.env.USER_LOCAL,
      password: process.env.PASSWORD_LOCAL,
      database: `${state}`,
    },
  });

  return queryState;
};
