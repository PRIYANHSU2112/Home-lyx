const express = require("express");
const router = express.Router();
const partnerWalletController = require("../controllers/partnerWalletController");
const { partnerRoute } = require("../midellwares/auth");

// All routes require partner authentication
router.use(partnerRoute);

// Wallet endpoints
router.get("/my-wallet", partnerWalletController.getMyWallet);
router.get("/partner-transactions", partnerWalletController.getTransactions);
router.get("/withdrawal-requests", partnerWalletController.getWithdrawalRequests);
router.get("/pending-commissions", partnerWalletController.getPendingCommissions);
router.get("/stats", partnerWalletController.getWalletStats);

// Withdrawal
router.post("/request-withdrawal", partnerWalletController.requestWithdrawal);

module.exports = router;
