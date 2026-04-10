const express = require("express");
const router = express.Router();

const { userRoute } = require("../../midellwares/auth");
const controller = require("../../controllers/ecommerce/transactionController");


// ============= Get ================
router.get("/transactions", userRoute, controller.getAllTransaction);
router.get("/transaction/:transactionId", userRoute, controller.getTransactionById);
router.get("/transactions/state", userRoute, controller.getFilterTransactionByState);
router.get("/transactions/:customerId", userRoute, controller.getTransactionByCustomerId);
router.get("/transactions/user/:userId", userRoute, controller.getTransactionsByUserId);

module.exports = router;