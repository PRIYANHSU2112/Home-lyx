const express = require("express");
const router = express.Router();
const adminSettlementController = require("../controllers/adminSettlementController");
const { adminMRoute } = require("../midellwares/auth");

// All routes require admin authentication
// router.use(adminRoute);

// Partner Management
router.get("/partners",adminMRoute, adminSettlementController.listPartners);
router.get("/partner/:partnerId/wallet",adminMRoute, adminSettlementController.getPartnerWallet);

// Commission Management
router.get("/commissions",adminMRoute, adminSettlementController.getCommissions);
router.post("/settle-batch",adminMRoute, adminSettlementController.settleBatch);

// Withdrawal Management
router.get("/admin-withdrawals",adminMRoute, adminSettlementController.getWithdrawals); //i
router.post("/withdrawal/:withdrawalId/accept",adminMRoute, adminSettlementController.acceptWithdrawal);
router.post("/withdrawal/:withdrawalId/complete",adminMRoute, adminSettlementController.completeWithdrawal);
router.post("/withdrawal/:withdrawalId/reject",adminMRoute, adminSettlementController.rejectWithdrawal);

// Transaction & Reporting
router.get("/transactions",adminMRoute, adminSettlementController.getAllTransactions);
router.get("/dashboard-stats",adminMRoute, adminSettlementController.getDashboardStats);

module.exports = router;
