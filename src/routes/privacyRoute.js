const controller = require("../controllers/privacyController");
const express = require("express");
const router = express.Router();
const { adminRoute } = require("../midellwares/auth");
router.param("privacyId", controller.getPrivacyId);
router.param("adminId", adminRoute);

// ================ Get ===========
router.get("/getPrivacyPolicy", controller.getPrivacyPolicy);

// =============== Admin ============
// ================= Post ================
router.post("/createPrivacyPolicy/:adminId", controller.createPrivacy);

// =============== Put ============
router.put("/updatePrivacyPolicy/:privacyId/:adminId", controller.updatePrivacy);

// ============== Delete ============
router.delete("/deletePrivacyPolicy/:privacyId/:adminId", controller.deletePrivacy);

module.exports = router;
