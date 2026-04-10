const controller = require("../controllers/homeCategoryCartController");
const { upload,imageValidetion } = require("../midellwares/multerMidellware");
const express = require("express");
const router = express.Router();
const { adminRoute } = require("../midellwares/auth");
const { isHomeCategory } = require("../midellwares/PermissionMidellware");
// =================== Admin  =====================

// =================== Midellwares ===================
router.param("HomeCategoryCartId", controller.getHomeCategoryCartId);
router.param("adminId", adminRoute);
// ================= post ==================
router.post(
  "/createHomeCategoryCart/:adminId",
  isHomeCategory,
  upload.single("image"),
  imageValidetion,
  controller.createHomeCategoryCart
);

// ==================== Put ==================
router.put(
  "/updateHomeCategoryCart/:HomeCategoryCartId/:adminId",
  isHomeCategory,
  upload.single("image"),
  imageValidetion,
  controller.updateHomeCategoryCart
);

// =========== get =============
router.get(
  "/getAllHomeCategoryCart/:adminId",
  isHomeCategory,
  controller.getAllHomeCategoryCart
);
router.get(
  "/getByHomeCategoryCartId/:HomeCategoryCartId/:adminId",
  isHomeCategory,
  controller.getByHomeCategoryCartId
);

// =================== delete ================
router.delete(
  "/deleteHomeCategoryCart/:HomeCategoryCartId/:adminId",
  isHomeCategory,
  controller.deleteHomeCategoryCart
);
module.exports = router;
