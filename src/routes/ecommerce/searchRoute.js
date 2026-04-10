const controller = require("../../controllers/ecommerce/searchController");
const express = require("express");
const router = express.Router();

// = search
router.get("/searchProducts",controller.searchProducts)  // done


module.exports = router;