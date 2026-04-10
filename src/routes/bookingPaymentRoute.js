const express = require("express");
const router = express.Router();
const bookingPaymentController = require("../controllers/bookingPaymentController");
const { userRoute, adminRoute } = require("../../src/midellwares/auth");

router.post(
  "/booking/pay/razorpay/create-order/:bookingId",
  userRoute,
  bookingPaymentController.createBookingRazorpayOrder,
);

//  VERIFY RAZORPAY PAYMENT (User)
router.post(
  "/booking/pay/razorpay/verify",
  userRoute,
  bookingPaymentController.verifyBookingRazorpayPayment,
); 

//  CASH ON DELIVERY (User)  
router.post(
  "/booking/pay/cod/:bookingId",
  userRoute,
  bookingPaymentController.payBookingByCOD,
);

//  WALLET PAYMENT (User)
router.post(
  "/booking/pay/wallet/:bookingId",
  userRoute,
  bookingPaymentController.payBookingByWallet,
);

module.exports = router;
