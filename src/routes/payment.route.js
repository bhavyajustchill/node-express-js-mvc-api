const express = require("express");
const router = express.Router();
const controller = require("../controllers/payment.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.post("/create-order", [authenticateToken], controller.createOrder);
router.post("/verify-payment", [authenticateToken], controller.verifyPayment);

module.exports = router;
