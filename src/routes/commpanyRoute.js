const controller = require("../controllers/commpanyController");
const express = require("express");
const { upload,imageValidetion } = require("../midellwares/multerMidellware");
const router = express.Router();
const { adminRoute } = require("../midellwares/auth");
const { isCompany } = require("../midellwares/PermissionMidellware");
router.param("adminId", adminRoute);
router.put(
  "/update/company/:adminId",   //done
  isCompany,
  upload.fields([
    { name: "banner", maxCount: 1 },
    { name: "loader", maxCount: 1 },
    { name: "fav_icon", maxCount: 1 },
    { name: "header_logo", maxCount: 1 },
    { name: "footer_logo", maxCount: 1 },
    { name: "signatory", maxCount: 1 },
    { name: "onboarding_images", maxCount: 10},
  ]),
  imageValidetion,
  controller.updateCompany
);
router.get("/get/company", controller.getCompany); //done

router.get(
  "/getCompanyByAdmin/:adminId",   // done
  isCompany,
  controller.getCompanyByAdmin
);
module.exports = router;
