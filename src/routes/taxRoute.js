const express = require("express");
const controller = require("../controllers/taxController");
const router = express.Router();
const { adminRoute } = require("../midellwares/auth");
router.param("adminId", adminRoute);
router.param("TaxtId", controller.getTaxtId);
const { isTax } = require("../midellwares/PermissionMidellware");

// =============== Admin ===============
// ================= Get ============

router.get("/getTaxById/:TaxtId/:adminId", isTax, controller.getByTaxId);
router.get("/getAllTax/:adminId", isTax, controller.getAllTax);

// ==================== Put ===================

router.put("/updateTax/:TaxtId/:adminId", isTax, controller.updateTax);

module.exports = router;
