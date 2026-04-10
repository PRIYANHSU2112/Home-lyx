const express = require("express");
const router = express.Router();
const platformFeeController = require("../controllers/platformFeeController");

const { userRoute, adminRoute } = require("../midellwares/auth");

router.post(
  "/creat-platform-fee/:adminId",
  adminRoute,
  platformFeeController.createPlatformFee
);

module.exports = router;
