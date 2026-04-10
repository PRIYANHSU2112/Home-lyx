const controller = require("../controllers/appBannerController");
const { upload,imageValidetion } = require("../midellwares/multerMidellware");
const express = require("express");
const router = express.Router();
const { adminRoute } = require("../midellwares/auth");
const { isAppBanner } = require("../midellwares/PermissionMidellware");


// =================== Admin  =====================

// =================== Midellwares ===================
router.param("AppBannerId", controller.getAppBannerId);
router.param("adminId", adminRoute);
// ================= post ==================
router.post(
  "/createAppBanner/:adminId",
  isAppBanner,
  upload.single("banner"),
  imageValidetion,
  controller.createAppBanner
);

// ==================== Put ==================
router.put(
  "/updateAppBanner/:AppBannerId/:adminId",
  isAppBanner,
  upload.single("banner"),
  imageValidetion,
  controller.updateappBanner
);

// =========== get =============
router.get(
  "/getAllAppBanner/:adminId",
  isAppBanner,
  controller.getAllAppBanner
);
router.get(
  "/getByAppBannerId/:AppBannerId/:adminId",
  isAppBanner,
  controller.getByAppBannerId
);

// =================== delete ================
router.delete(
  "/deleteAppBanner/:AppBannerId/:adminId",
  isAppBanner,
  controller.deleteappBanner
);
module.exports = router;
