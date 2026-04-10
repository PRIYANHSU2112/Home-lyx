const controller = require("../../controllers/ecommerce/reviewController");
const express = require("express");
const router = express.Router();
const { adminRoute } = require("../../midellwares/auth");

router.param("reviewId", controller.getReviewId);
router.param("adminId", adminRoute);
// =================== Post ==============
router.post("/eCommerce/createReview", controller.createReview);

// =================== Get ===============
router.get("/eCommerce/getReviewById/:reviewId", controller.getReviewById);

// ================ Put ==============
router.put("/eCommerce/updateReview/:reviewId", controller.updateReview);

// =================== delete ==============
router.delete("/eCommerce/deleteReview/:reviewId", controller.deleteReview);

// ================== admin ==================
router.put("/eCommerce/disableReview/:reviewId/:adminId", controller.disableReview);

router.get("/eCommerce/getAllReviewByProductId/:productId", controller.getAllReviewByProductId);

module.exports = router;
