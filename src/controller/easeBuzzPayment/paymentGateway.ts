require("dotenv").config();
import axios from "axios";
import { sha512 } from "js-sha512";
import { Request, Response } from "express";
import { connectToDatabase } from "../../config/dbutil";
import { getBaseUrl, curl_call } from "./util";

type ConfigType = {
  key: string;
  salt: string;
  env: string;
  enable_iframe: string | number;
};

let config: ConfigType;

export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    config = {
      key: process.env.EASEBUZZ_KEY || "default_key",
      salt: process.env.EASEBUZZ_SALT || "default_salt",
      env: process.env.EASEBUZZ_ENV || "test",
      enable_iframe: process.env.EASEBUZZ_IFRAME || "0",
    };

    const dbName = "UK";
    const systemDB = await connectToDatabase(dbName);

    function generateHash() {
      const hashstring = `${config.key}|${data.txnid}|${data.amount}|${
        data.productinfo
      }|${data.name}|${data.email}|${data.udf1 || ""}|${data.udf2 || ""}|${
        data.udf3 || ""
      }|${data.udf4 || ""}|${data.udf5 || ""}|${data.udf6 || ""}|${
        data.udf7 || ""
      }|${data.udf8 || ""}|${data.udf9 || ""}|${data.udf10 || ""}|${
        config.salt
      }`;
      return sha512(hashstring);
    }

    var hash_key = generateHash();
    console.log("Generated Hash:", hash_key);
    const paymentUrl = getBaseUrl(config.env) + "/payment/initiateLink";

    // const paymentUrl = "https://testpay.easebuzz.in/payment/initiateLink";

    const form = {
      key: config.key,
      txnid: data.txnid,
      amount: data.amount,
      email: data.email,
      phone: data.phone,
      firstname: data.name,
      productinfo: data.productinfo,
      furl: data.furl,
      surl: data.surl,
      hash: hash_key,
    };
    console.log("Form Data:", form);

    // Insert into the database
    await systemDB("payment_log").insert({
      txnid: data.txnid,
      amount: data.amount,
      productinfo: data.productinfo,
      name: data.name,
      email: data.email,
      phone: data.phone,
    });

    const response = await curl_call(paymentUrl, form);
    console.log(response, "resp");

    if (response.status !== 1) {
      return res.status(400).json({
        message: "Payment initiation failed",
        error: {
          status: response.status,
          error_desc: response.error_desc,
          data: response.data,
        },
      });
    }

    if (config.enable_iframe === "0") {
      const paymentRedirectUrl =
        getBaseUrl(config.env) + "/pay/" + response.data;
      res.json(paymentRedirectUrl);
    } else {
      return res.render("enable_iframe.html", {
        key: config.key,
        access_key: response.access_key,
      });
    }
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export const handlePaymentResponse = (req: Request, res: Response) => {
  try {
    const response = req.body;

    if (checkReverseHash(response, req.body.hash)) {
      res.json(response);
    } else {
      res.send("false, check the hash value");
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Function to check reverse hash
const checkReverseHash = (response: any, hash: string) => {
  const hashstring = `${config.salt}|${response.status}|${response.udf10}|${response.udf9}|${response.udf8}|${response.udf7}|${response.udf6}|${response.udf5}|${response.udf4}|${response.udf3}|${response.udf2}|${response.udf1}|${response.email}|${response.firstname}|${response.productinfo}|${response.amount}|${response.txnid}|${response.key}`;
  const calculatedHash = sha512(hashstring);

  console.log("Generated Hash:", calculatedHash);
  console.log("Received Hash:", hash);

  return calculatedHash === hash;
};
