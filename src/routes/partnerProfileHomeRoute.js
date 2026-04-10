const express = require("express");
const controller = require("../controllers/partnerProfileHomeController");
const midellwares = require("../midellwares/multerMidellware");
const router = express.Router();
const { adminRoute } = require("../midellwares/auth");
// ================== Midellwares ================== ||
router.param("adminId", adminRoute);

// =============== Put ==========
router.put(
  "/updatePartnerProfileHome/:partnerProfileHomeId/:adminId",
  midellwares.upload.single("banner"),
  midellwares.imageValidetion,
  controller.updateModel
);

// =============== get ===========
router.get("/getBypartnerProfilehome", controller.getById);

module.exports = router;
