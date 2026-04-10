const controller = require("../../controllers/ecommerce/homeBannerController");
const { upload,imageValidetion } = require("../../midellwares/multerMidellware");
const express = require("express");
const router = express.Router();
const { adminRoute } = require("../../midellwares/auth");
const { isHomebanner } = require("../../midellwares/PermissionMidellware");
// =================== Addmin  =====================

// =================== Midellwares ===================
router.param("HomeBannerId", controller.getHomeBannerId);
router.param("adminId", adminRoute);
// ================= post ==================
router.post(
  "/eCommerce/createHomeBanner/:adminId",      //done
  isHomebanner,
  upload.single("banner"),
  imageValidetion,
  controller.createHomeBanner
);

// ==================== Put ==================
router.put(
  "/eCommerce/updateHomeBanner/:HomeBannerId/:adminId",   // done
  isHomebanner,
  upload.single("banner"),
  imageValidetion,
  controller.updateHomeBanner
);

// =========== get =============
router.get(
  "/eCommerce/getAllHomeBanner/:adminId",   // done
  isHomebanner,
  controller.getAllHomeBanner
);
router.get(
  "/eCommerce/getByHomeBannerId/:HomeBannerId/:adminId",  // done
  controller.getByHomeBannerId
);

// =================== delete ================
router.delete(
  "/eCommerce/deleteHomeBanner/:HomeBannerId/:adminId",  //done  
  isHomebanner,
  controller.deleteHomeBanner
);

router.patch(
  "/eCommerce/disableBanner/:HomeBannerId/:adminId",  //done  
  isHomebanner,
  controller.disableBanner
);
module.exports = router;
