const express = require("express");
const router = express.Router();
const adminSettlementController = require("../controllers/adminSettlementController");
const { adminRoute } = require("../midellwares/auth");

// All routes require admin authentication
router.use(adminRoute);

// Partner Management
router.get("/partners", adminSettlementController.listPartners);
router.get("/partner/:partnerId/wallet", adminSettlementController.getPartnerWallet);

// Commission Management
router.get("/commissions", adminSettlementController.getCommissions);
router.post("/settle-batch", adminSettlementController.settleBatch);

// Withdrawal Management
router.get("/withdrawals", adminSettlementController.getWithdrawals);
router.post("/withdrawal/:withdrawalId/approve", adminSettlementController.approveWithdrawal);
router.post("/withdrawal/:withdrawalId/reject", adminSettlementController.rejectWithdrawal);

// Transaction & Reporting
router.get("/transactions", adminSettlementController.getAllTransactions);
router.get("/dashboard-stats", adminSettlementController.getDashboardStats);

module.exports = router;
