import express from "express";
import { initiatePayment } from "../controller/easeBuzzPayment/paymentGateway";

const router = express.Router();

router.post("/pay", initiatePayment);

export default router;
