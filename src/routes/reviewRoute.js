const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { userRoute, adminRoute } = require("../midellwares/auth");

// user review
router.post("/create-review", userRoute, reviewController.createReview);

// get category rating + comments
router.get(
  "/subcategory-rating-summary/:subCategoryId",
  reviewController.getSubCategoryRatingSummary
);

// admin disable
router.patch(
  "/disable-review/:reviewId/:adminId",
  adminRoute,
  reviewController.disableReview
);

module.exports = router;
