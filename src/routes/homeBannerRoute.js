const controller = require("../controllers/homeBannerController");
const { upload,imageValidetion } = require("../midellwares/multerMidellware");
const express = require("express");
const router = express.Router();
const { adminRoute } = require("../midellwares/auth");
const { isHomebanner } = require("../midellwares/PermissionMidellware");
// =================== Addmin  =====================

// =================== Midellwares ===================
router.param("HomeBannerId", controller.getHomeBannerId);
router.param("adminId", adminRoute);
// ================= post ==================
router.post(
  "/createHomeBanner/:adminId",
  isHomebanner,
  upload.single("banner"),
  imageValidetion,
  controller.createHomeBanner
);

// ==================== Put ==================
router.put(
  "/updateHomeBanner/:HomeBannerId/:adminId",
  isHomebanner,
  upload.single("banner"),
  imageValidetion,
  controller.updateHomeBanner
);

// =========== get =============
router.get(
  "/getAllHomeBanner/:adminId",
  isHomebanner,
  controller.getAllHomeBanner
);
router.get(
  "/getByHomeBannerId/:HomeBannerId/:adminId",
  controller.getByHomeBannerId
);

// =================== delete ================
router.delete(
  "/deleteHomeBanner/:HomeBannerId/:adminId",
  isHomebanner,
  controller.deleteHomeBanner
);
module.exports = router;
