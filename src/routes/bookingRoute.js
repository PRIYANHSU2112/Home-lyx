const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { userRoute, adminRoute } = require("../../src/midellwares/auth");

router.post("/create-booking", userRoute, bookingController.createBooking);

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

module.exports = router;

// ADMIN CANCEL BOOKING
router.put(
  "/booking/cancel/:bookingId/:adminId",
  adminRoute,
  bookingController.cancelBookingByAdmin,
);
