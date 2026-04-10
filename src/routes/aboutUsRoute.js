const controller = require("../controllers/aboutUsController");
const express = require("express");
const router = express.Router();
const { adminRoute } = require("../midellwares/auth");
router.param("adminId", adminRoute);
router.param("aboutUsId", controller.getAboutUsId);

// ================ Get ===========
router.get("/getAboutUs", controller.getAboutUs);

// =============== Admin ============
// ================= Post ================
router.post("/createAboutUs/:adminId", controller.createAboutUs);

// =============== Put ============
router.put("/updateAboutUs/:aboutUsId/:adminId", controller.updateAboutUs);

// ============== Delete ============
router.delete("/deleteAboutUs/:aboutUsId/:adminId", controller.deleteAboutUs);

module.exports = router;
