const express = require("express");
const router = express.Router();
const controller = require("../controllers/FAQController");
const { adminRoute } = require("../midellwares/auth");

router.param("FAQId", controller.getFAQId);
router.param("adminId", adminRoute);

// Get

router.get("/getAllFAQ", controller.getAllFAQ);
router.get("/getAllFAQAdmin", adminRoute, controller.getAllFAQAdmin);
router.get("/getFAQ/:FAQId/:adminId", controller.getByFAQId);
router.get("/faq/by-help-support/:helpSupportId", controller.getFAQByHelpSupport);

// Admin
router.post("/createFAQ/:adminId", controller.createFAQ);
router.put("/updateFAQ/:FAQId/:adminId", controller.updateFAQ);
router.delete("/deleteFAQ/:FAQId/:adminId", controller.deleteFAQ);

module.exports = router;
