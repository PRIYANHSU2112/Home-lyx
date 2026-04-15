const express = require("express");
const router = express.Router();
const partnerWalletController = require("../controllers/partnerWalletController");
const { partnerRoute } = require("../midellwares/auth");

// All routes require partner authentication
// Removed router.use(partnerRoute) to prevent middleware leakage down the Express stack

// Wallet endpoints
router.get("/my-wallet", partnerRoute, partnerWalletController.getMyWallet);
router.get("/partner-transactions", partnerRoute, partnerWalletController.getTransactions);
router.get("/withdrawal-requests", partnerRoute, partnerWalletController.getWithdrawalRequests);
router.get("/pending-commissions", partnerRoute, partnerWalletController.getPendingCommissions);
router.get("/stats", partnerRoute, partnerWalletController.getWalletStats);

// Withdrawal
router.post("/request-withdrawal", partnerRoute, partnerWalletController.requestWithdrawal);

module.exports = router;
