const controller = require("../../controllers/ecommerce/homeCategoryCartController");
const { upload,imageValidetion } = require("../../midellwares/multerMidellware");
const express = require("express");
const router = express.Router();
const { adminRoute } = require("../../midellwares/auth");
const { isHomeCategory } = require("../../midellwares/PermissionMidellware");
// =================== Admin  =====================

// =================== Midellwares ===================
router.param("HomeCategoryCartId", controller.getHomeCategoryCartId);
router.param("adminId", adminRoute);
// ================= post ==================
router.post(
  "/eCommerce/createHomeCategoryCart/:adminId",
  isHomeCategory,
  upload.single("image"),
  imageValidetion,
  controller.createHomeCategoryCart
);

// ==================== Put ==================
router.put(
  "/eCommerce/updateHomeCategoryCart/:HomeCategoryCartId/:adminId",
  isHomeCategory,
  upload.single("image"),
  imageValidetion,
  controller.updateHomeCategoryCart
);

// =========== get =============
router.get(
  "/eCommerce/getAllHomeCategoryCart/:adminId",
  isHomeCategory,
  controller.getAllHomeCategoryCart
);
router.get(
  "/eCommerce/getByHomeCategoryCartId/:HomeCategoryCartId/:adminId",
  isHomeCategory,
  controller.getByHomeCategoryCartId
);

// =================== delete ================
router.delete(
  "/eCommerce/deleteHomeCategoryCart/:HomeCategoryCartId/:adminId",
  isHomeCategory,
  controller.deleteHomeCategoryCart
);
module.exports = router;
