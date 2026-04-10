const controller = require("../controllers/categoryController");
const express = require("express");
const router = express.Router();
const { upload, imageValidetion } = require("../midellwares/multerMidellware");
const { adminRoute,partnerRoute } = require("../midellwares/auth");
const { isCategory } = require("../midellwares/PermissionMidellware");

// router.param("categoryId", controller.getCategoryId);
// router.param("categoryId", controller.getByCategoryIdService)
router.get("/getByCategoryId/:categoryId", controller.getCategoryById);
router.param("adminId", adminRoute);
//  ============ Get =========

router.get("/getByCategorySlug", controller.getCategorySlug);

router.get("/getCityIdCategory/:cityId", controller.getCityIdCategory);
router.get("/getAllCategory", controller.getAllCategory);
router.get(
  "/getCategoryWithPcategoryByUser/:pCategory",
  controller.getCategoryWithPcategoryByUser,
);
router.get(
  "/getCategoryWithPcategoryByUserSlug",
  controller.getCategoryWithPcategoryByUserSlug,
);
router.get(
  "/getProductBySubCategory/:categoryId",
  controller.getProductBySubCategory,
);
router.get(
  "/getProductBySubCategorySlug",
  controller.getProductBySubCategorySlug,
);



// ================ Admin ===============

// ============== Post =============
// router.post(
//   "/createCategory/:adminId",
//   isCategory,
//   upload.fields([{ name: "banner" }, { name: "icon" }]),
//   imageValidetion,
//   controller.createCategory
// );

router.post(
  "/createCategory/:adminId",
  isCategory,
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "banner" },
    { name: "images" },
    { name: "videos" },
  ]),
  imageValidetion,
  controller.createCategory,
);

// ================= Put ==========
// router.put(
//   "/updateCategory/:categoryId/:adminId",
//   isCategory,
//   upload.fields([{ name: "banner" }, { name: "icon" }]),
//   imageValidetion,
//   controller.updateCategory
// );

router.put(
  "/updateCategory/:categoryId/:adminId",
  isCategory,
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "banner" },
    { name: "images" },
    { name: "videos" },
  ]),
  imageValidetion,
  controller.updateCategory,
);

router.patch(
  "/toggleCategoryStatus/:categoryId/:adminId",
  controller.toggleCategoryStatus,
);

router.put("/unLinks/:categoryId/:adminId", isCategory, controller.unLinks);

// =================== Delete ==============
router.delete(
  "/deleteCategory/:categoryId/:adminId",
  isCategory,
  controller.deleteCategory,
);

// ================= Get ==================
router.get(
  "/getAllCategoryByAdmin/:adminId",
  isCategory,
  controller.getAllCategoryByAdmin,
);
router.get(
  "/getAllCategoryWithPcategory/:adminId",
  isCategory,
  controller.getAllCategoryWithPcategory,
);
router.get(
  "/getAllNullPcategory/:adminId",
  isCategory,
  controller.getAllNullPcategory,
);
router.get(
  "/getCategoryWithPcategory/:pCategory/:adminId",
  isCategory,
  controller.getCategoryWithPcategory,
);
router.get(
  "/getAllSubCategory/:adminId",
  isCategory,
  controller.getAllSubCategory,
);

// ================ Partner Routes ===============

// Partner creates category with pending status
router.post(
  "/partner/createCategory",
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "banner" },
    { name: "images" },
    { name: "videos" },
  ]),
  partnerRoute,
  imageValidetion,
  controller.partnerCreateCategory,
);

// Partner get their own categories
router.get(
  "/partner/myCategories/:partnerId",
  partnerRoute,
  controller.partnerGetMyCategories,
);

router.get(
  "/partner/categorie-detail/:categoryId",
  partnerRoute,
  controller.getCategoryById,
);

// Partner update their own category (if pending)
router.put(
  "/partner/updateCategory/:categoryId/:partnerId",
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "banner" },
    { name: "images" },
    { name: "videos" },
  ]),
  partnerRoute,
  imageValidetion,
  controller.partnerUpdateCategory,
);

// Partner toggle disable/enable their own category
router.post(
  "/partner/toggleDisable/:categoryId",
  partnerRoute,
  controller.partnerToggleDisable,
);

// ================ Admin Actions on Partner Categories ===============

// Admin get pending categories for approval
router.get(
  "/admin/pendingCategories/:adminId",
  isCategory,
  controller.adminGetPendingCategories,
);

// Admin approve category
router.patch(
  "/admin/approveCategory/:categoryId/:adminId",
  isCategory,
  controller.adminApproveCategory,
);

// Admin reject category with reason
router.patch(
  "/admin/rejectCategory/:categoryId/:adminId",
  isCategory,
  controller.adminRejectCategory,
);

module.exports = router;