import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectToDatabase } from "./src/config/db";
import payment from "./src/routes/payment";
import path from "path";

require("dotenv").config();

const app = express();
const port = process.env.SERVER_PORT;
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  // credentials: true,
  sameSite: "none",
};
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cookieParser());

app.use("/api", payment);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, Express!");
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  connectToDatabase();
});
