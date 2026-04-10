const controller = require("../../controllers/ecommerce/homePageController");
const express = require("express");
const router = express.Router();
// =================== get  =====================

router.get("/eCommerce/homePage", controller.homePage);

module.exports = router;
