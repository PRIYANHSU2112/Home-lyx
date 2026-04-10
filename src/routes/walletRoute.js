const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");
const { userRoute } = require("../midellwares/auth");

router.get("/wallet/me", userRoute, walletController.getMyWallet);

router.post("/wallet/topup/create-order", userRoute, walletController.createWalletTopupOrder);

router.post("/wallet/topup/verify", userRoute, walletController.verifyWalletTopup);

router.get("/wallet/history", userRoute, walletController.getWalletHistory);

module.exports = router;
