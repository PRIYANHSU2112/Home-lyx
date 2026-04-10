const controller = require("../controllers/couponController");
const express = require("express");
const router = express.Router();

const { upload, imageValidetion } = require("../midellwares/multerMidellware");
const { adminRoute, userRoute } = require("../midellwares/auth");
const { isCoupon } = require("../midellwares/PermissionMidellware");
const { billDetailEcommerce } = require("../midellwares/billDetail");

/* ================= PARAMS ================= */

router.param("couponId", controller.getCouponId);
router.param("adminId", adminRoute);

/* ================= USER ROUTES ================= */

router.get("/getAllCoupon", userRoute, controller.getAllCoupon);

router.get(
  "/getCouponById/:couponId",
  userRoute,
  controller.getCouponById
);

router.get(
  "/getCouponByCategory",
  userRoute,
  controller.getCouponsByCategory
);

/* ================= APPLY COUPON ================= */

// router.post(
//   "/apply-coupon/:couponCode?",
//   userRoute,
//   billDetailEcommerce,
//   controller.applyCouponController
// );

/* ================= ADMIN ROUTES ================= */

router.post(
  "/creatCoupon/:adminId",
  isCoupon,
  upload.single("icon"),
  imageValidetion,
  controller.creatCoupon
);


//  apply

router.post(
  "/apply-coupon/:customerId",
  // protect,
  billDetailEcommerce,   
  controller.applyCouponController  
);

router.put(
  "/updateCoupon/:couponId/:adminId",
  isCoupon,
  upload.single("icon"),
  imageValidetion,
  controller.updateCoupon
);

router.patch(
  "/disableCoupon/:couponId/:adminId",
  isCoupon,
  controller.disableCoupon
);

router.get(
  "/getAllCouponByAdmin/:adminId",
  isCoupon,
  controller.getAllCoupon
);

module.exports = router;
