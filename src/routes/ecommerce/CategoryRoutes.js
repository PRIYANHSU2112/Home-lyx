const controller = require("../../controllers/ecommerce/CategoryController");
const express = require("express");
const router = express.Router();
const {
  upload,
  imageValidetion,
} = require("../../midellwares/multerMidellware");
const { adminRoute } = require("../../midellwares/auth");
const { isCategory } = require("../../midellwares/PermissionMidellware");

router.param("categoryId", controller.getCategoryId);
router.param("adminId", adminRoute);

//  ============ Get =========
router.get(
  "/eCommerce/getByCategoryId/:categoryId",   //done
  controller.getByCategoryId
);

router.get(
  "/eCommerce/getCategorySizes/:categoryId",
  controller.getCategorySizes
);

router.get("/eCommerce/getCategoryBySlug",controller.getCategoryBySlug); //done


router.get("/eCommerce/getAllCategory", controller.getAllCategory);   //done

// router.get(
//   "/eCommerce/getProductBySubCategory/:categoryId",
//   controller.getProductBySubCategory
// );


// router.get(
//   "/eCommerce/getProductBySubCategorySlug",
//   controller.getProductBySubCategorySlug
// );


// router.get(
//   "/eCommerce/getCategoryWithPcategoryByUser/:pCategory",
//   controller.getCategoryWithPcategoryByUser
// );


// router.get(
//   "/eCommerce/getCategoryWithPcategoryByUserSlug",
//   controller.getCategoryWithPcategoryByUserSlug
// );

// ================ Admin ===============

// ============== Post =============
router.post(
  "/eCommerce/createCategory/:adminId",   // done
  isCategory,
 upload.fields([{ name: "icon" }]),
  imageValidetion,
  controller.createCategory
);

// ================= Put ==========
router.put(
  "/eCommerce/updateCategory/:categoryId/:adminId", // done
  isCategory,
  upload.fields([{ name: "banner" }, { name: "icon" }]),
  imageValidetion,
  controller.updateCategory
);
router.patch(
  "/eCommerce/disableCategory/:categoryId/:adminId",  //done
  isCategory,
  controller.disableCategory
);
router.put(
  "/eCommerce/unLinks/:categoryId/:adminId",
  isCategory,
  controller.unLinks
);

// =================== Delete ==============
router.delete(
  "/eCommerce/deleteCategory/:categoryId/:adminId", // done
  isCategory,
  controller.deleteCategory
);

// =================== get ==============
router.get(
  "/eCommerce/getAllCategoryByAdmin/:adminId",
  isCategory,
  controller.getAllCategory
);
// router.get(
//   "/eCommerce/getAllCategoryWithPcategory/:adminId",
//   isCategory,
//   controller.getAllCategoryWithPcategory
// );
router.get(
  "/eCommerce/getAllNullPcategory/:adminId",
  isCategory,
  controller.getAllNullPcategory
);


// router.get(
//   "/eCommerce/getCategoryWithPcategory/:pCategory/:adminId",
//   isCategory,
//   controller.getCategoryWithPcategory
// );
// router.get(
//   "/eCommerce/getAllSubCategory/:adminId",
//   isCategory,
//   controller.getAllSubCategory
// );
module.exports = router;
