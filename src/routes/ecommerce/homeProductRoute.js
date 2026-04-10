const controller = require("../../controllers/ecommerce/homeProductController");
const express = require("express");
const router = express.Router();
const { adminRoute } = require("../../midellwares/auth");
const { isHomeProduct } = require("../../midellwares/PermissionMidellware");
// =================== Admin  =====================

// =================== Midellwares ===================
router.param("HomeProductId", controller.getHomeProductId);
router.param("adminId", adminRoute);
// ================= post ==================
router.post(
  "/eCommerce/createHomeProduct/:adminId",
  isHomeProduct,
  controller.createHomeProduct
);

// ==================== Put ==================
router.put(
  "/eCommerce/updateHomeProduct/:HomeProductId/:adminId",
  isHomeProduct,
  controller.updateHomeProduct
);

// =========== get =============
router.get(
  "/eCommerce/getAllHomeProduct/:adminId",
  isHomeProduct,
  controller.getAllHomeProduct
);
router.get(
  "/eCommerce/getByHomeProductId/:HomeProductId/:adminId",
  isHomeProduct,
  controller.getByHomeProductId
);

// =================== delete ================
router.delete(
  "/eCommerce/deleteHomeProduct/:HomeProductId/:adminId",
  isHomeProduct,
  controller.deleteHomeProduct
);

module.exports = router;
