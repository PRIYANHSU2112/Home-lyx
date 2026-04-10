const controller = require("../controllers/homeProductController");
const express = require("express");
const router = express.Router();
const { adminRoute } = require("../midellwares/auth");
const { isHomeProduct } = require("../midellwares/PermissionMidellware");

// =================== Admin  =====================

// =================== Midellwares ===================
router.param("HomeProductId", controller.getHomeProductId);
router.param("adminId", adminRoute);
// ================= post ==================
router.post(
  "/createHomeProduct/:adminId",
  isHomeProduct,
  controller.createHomeProduct
);

// ==================== Put ==================
router.put(
  "/updateHomeProduct/:HomeProductId/:adminId",
  isHomeProduct,
  controller.updateHomeProduct
);

// =========== get =============
router.get(
  "/getAllHomeProduct/:adminId",
  isHomeProduct,
  controller.getAllHomeProduct
);
router.get(
  "/getByHomeProductId/:HomeProductId/:adminId",
  isHomeProduct,
  controller.getByHomeProductId
);

// =================== delete ================
router.delete(
  "/deleteHomeProduct/:HomeProductId/:adminId",
  isHomeProduct,
  controller.deleteHomeProduct
);

module.exports = router;
