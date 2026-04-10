const controller = require("../controllers/memberShipController");
const express = require("express");
const router = express.Router();
const { upload,imageValidetion } = require("../midellwares/multerMidellware");
const {adminRoute} = require("../midellwares/auth")
const {isMembership} = require("../midellwares/PermissionMidellware")
router.param("membershipId", controller.getMembershipId);
router.param("adminId", adminRoute);


// ===================== Get ===============
router.get("/getAllMembership", controller.getAllMembership);
router.get("/getByMembershipId/:membershipId", controller.getByMembershipId);


// ==================== admin ===============

// =================== Post ===============
router.post(
  "/createMembership/:adminId",isMembership,
  upload.single("logo"),
  imageValidetion,
  controller.createMembership
);

// ================= Put ==============
router.put(
  "/updateMembership/:membershipId/:adminId",isMembership,
  upload.single("logo"),
  imageValidetion,
  controller.updateMembership
);
router.put("/disableMembership/:membershipId/:adminId",isMembership, controller.disableMembership);

// ================ delete =============
router.delete("/deleteMembership/:membershipId/:adminId",isMembership, controller.deleteMembership);

// ============== Get ============== 
router.get("/getAllMembershipByAdmin/:adminId",isMembership,controller.getAllMembershipByAdmin)
module.exports = router;
