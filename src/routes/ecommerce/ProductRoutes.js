const controller = require("../../controllers/ecommerce/ProductController");
const express = require("express");
const router = express.Router();
const { upload,imageValidetion } = require("../../midellwares/multerMidellware");
const midellwares = require("../../midellwares/datefilter");
const { adminRoute , partnerRoute } = require("../../midellwares/auth");
const { isProduct } = require("../../midellwares/PermissionMidellware");
// =================== Midellware ==============
router.param("productId", controller.getProductId);
router.param("adminId", adminRoute);
// ============= get =============
router.get("/eCommerce/getProduct/:value", controller.getByProductId);//slug ke liye bhi hai  //done
// admin get product
router.get("/eCommerce/getProduct/:value/:admin", controller.getByProductIdPartner);//slug ke liye bhi hai  //done
// partner get product
router.get("/eCommerce/getProduct-partner/:value", partnerRoute, controller.getByProductIdPartner);//slug ke liye bhi hai  //done

router.get("/eCommerce/getAllProduct", controller.getAllProduct);   // done
router.get("/eCommerce/getAllProduct/:brandId", controller.getAllProductByBrandId);   // done
router.get("/eCommerce/getAllProduct/category/:categoryId", controller.getAllProductByCategoryId);   // done
router.get("/eCommerce/getAllProductByPartnerId", partnerRoute, controller.getAllProductByPartnerId);

// =================== Admin ================

// ================= Post ==============
router.post(
  "/eCommerce/createProduct/:adminId",  //done
  isProduct,
  upload.fields([
    { name: "images" },
    { name: "additional" },
    { name: "thumnail" },
  ]),
  imageValidetion,
  controller.createProduct
);

// partner create product
router.post(
  "/eCommerce/createProduct",  //done
  partnerRoute,
  upload.fields([
    { name: "images" },
    { name: "additional" },
    { name: "thumnail" },
  ]),
  imageValidetion,
  controller.createProduct
);
// ============================= Get ==================
// router.get(
//   "/eCommerce/filterProductByDate/:adminId",
//   isProduct,
//   midellwares.date,
//   controller.filterProductByDate
// );

// ===================== Put ===============
router.put(
  "/eCommerce/updateProduct/:productId/:adminId",  //done
  isProduct,
  upload.fields([
    { name: "images" },
    { name: "additional" },
    { name: "thumnail" },
  ]),
  imageValidetion,
  controller.updateProduct
);

// partner update product
router.put(
  "/eCommerce/updateProduct/:productId",  //done
  partnerRoute,
  isProduct,
  upload.fields([
    { name: "images" },
    { name: "additional" },
    { name: "thumnail" },
  ]),
  imageValidetion,
  controller.updateProduct
);


router.patch(
  "/eCommerce/disableProduct/:productId/:adminId",  //done
  isProduct,
  controller.disableProduct
);


router.patch(
  "/eCommerce/productUnLinks/:productId/:adminId", 
  isProduct,
  controller.productUnLinks
);

router.patch(
  "/eCommerce/updateProductStatus/:productId/:adminId",
  isProduct,
  controller.updateProductStatus
);

// ===================== Delete ==============
router.delete(
  "/eCommerce/deleteProduct/:productId/:adminId", // done
  isProduct,
  controller.deleteProduct
);

module.exports = router;
