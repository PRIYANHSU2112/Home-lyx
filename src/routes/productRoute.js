const controller = require("../controllers/productController");
const express = require("express");
const router = express.Router();
const { upload,imageValidetion } = require("../midellwares/multerMidellware");
const midellwares = require("../midellwares/datefilter");
const { adminRoute } = require("../midellwares/auth");
const { isProduct } = require("../midellwares/PermissionMidellware");
// =================== Midellware ==============
router.param("productId", controller.getProductId);
router.param("adminId", adminRoute);
// ============= get =============
router.get("/getByProductId/:productId", controller.getByProductId);
router.get("/getByProductIdSlug/:slug", controller.getByProductIdSlug);
router.get("/getAllProduct", controller.getAllProduct);

// =================== Admin ================

// ================= Post ==============
router.post(
  "/createProduct/:adminId",
  isProduct,
  upload.fields([
    { name: "images" },
    { name: "additional" },
    { name: "thumnail" },
  ]),
  imageValidetion,
  controller.createProduct
);

// ============================= Get ==================
router.get(
  "/filterProductByDate/:adminId",
  isProduct,
  midellwares.date,
  controller.filterProductByDate
);

// ===================== Put ===============
router.put(
  "/updateProduct/:productId/:adminId",
  isProduct,
  upload.fields([
    { name: "images" },
    { name: "additional" },
    { name: "thumnail" },
  ]),
  imageValidetion,
  controller.updateProduct
);
router.put(
  "/disableProduct/:productId/:adminId",
  isProduct,
  controller.disableProduct
);
router.put(
  "/productUnLinks/:productId/:adminId",
  isProduct,
  controller.productUnLinks
);

// ===================== Delete ==============
router.delete(
  "/deleteProduct/:productId/:adminId",
  isProduct,
  controller.deleteProduct
);

module.exports = router;
