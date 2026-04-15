const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { userRoute, adminRoute, partnerRoute } = require("../../src/midellwares/auth");

router.post("/create-booking", userRoute, bookingController.createBooking);
router.patch(
  "/partner/respond/:bookingId",
  partnerRoute,
  bookingController.partnerRespondBooking,
);

// Partner booking management routes
router.get(
  "/partner/bookings/:partnerId",
  partnerRoute,
  bookingController.getPartnerBookings,
);

router.get(
  "/partner/booking/:bookingId/:partnerId",
  partnerRoute,
  bookingController.getPartnerBookingDetail,
);


router.get("/user-bookings", userRoute, bookingController.getUserBookings);


router.get(
  "/get-booking/:bookingId",
  userRoute,
  bookingController.getBookingById,
);

router.patch(
  "/cancel-booking/:bookingId",
  userRoute,
  bookingController.cancelBookingByUser,
);

//  ADMIN

// Get all bookings
router.get(
  "/all-bookings/:adminId",
  adminRoute,
  bookingController.getAllBookingsByAdmin,
);

router.get(
  "/get-booking/:bookingId/:adminId",
  adminRoute,
  bookingController.getBookingById,
);

// Update booking status
router.patch(
  "/update-booking-status/:bookingId/:adminId",
  adminRoute,
  bookingController.updateBookingStatusByAdmin,
);


// ADMIN CANCEL BOOKING
router.put(
  "/booking/cancel/:bookingId/:adminId",
  adminRoute,
  bookingController.cancelBookingByAdmin,
);


module.exports = router;

