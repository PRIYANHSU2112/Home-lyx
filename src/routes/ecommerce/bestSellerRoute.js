const express = require("express");
const router = express.Router();
const bestSellerController = require("../../controllers/ecommerce/bestSellerController");

// @route   GET /api/best-sellers
// @desc    Get top 10 best selling products in ecommerce
router.get("/best-sellers", bestSellerController.getBestSellers);

module.exports = router;
