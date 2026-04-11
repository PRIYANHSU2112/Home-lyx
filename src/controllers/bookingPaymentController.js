const crypto = require("crypto");
const bookingModel = require("../models/bookingModel");
const transactionModel = require("../models/ecommerce/transactionModel");
const { razorpay } = require("../../config/razorpay");
const walletModel = require("../models/walletModel");
const settlementService = require("../services/settlementService");
const mongoose = require("mongoose");
const {
  sendNotificationToUserOnServiceBooking,
} = require("./notificationController");

// 1) Create Razorpay Order
exports.createBookingRazorpayOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId } = req.params;

    const booking = await bookingModel.findOne(
      { _id: bookingId, userId: req.user._id },
      null,
      { session },
    );

    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (booking.paymentStatus === "PAID") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Already paid" });
    }

    if (booking.bookingStatus === "CANCELLED") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Booking is cancelled" });
    }

    const amount = Number(booking.finalPayableAmount);

    // Razorpay order creation (external API) - keep outside DB operations but still fine
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `booking_${booking._id}`,
    });

    const transaction = await transactionModel.create(
      [
        {
          bookingId: booking._id,
          customerId: req.user._id,
          amount,
          currency: "INR",
          paymentGateway: "RAZORPAY",
          paymentMethod: "ONLINE",
          status: "CREATED",
          razorpayOrderId: razorpayOrder.id,
        },
      ],
      { session },
    );

    booking.transactionId = transaction[0]._id;

    booking.paymentMethod = "RAZORPAY";
    booking.paymentStatus = "PENDING";
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Razorpay order created",
      data: {
        bookingId: booking._id,
        razorpayOrderId: razorpayOrder.id,
        amount,
        currency: razorpayOrder.currency,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2) Verify Razorpay Payment
exports.verifyBookingRazorpayPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !bookingId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "All payment fields required",
      });
    }

    const booking = await bookingModel.findOne(
      { _id: bookingId, userId: req.user._id },
      null,
      { session },
    );

    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (booking.paymentStatus === "PAID") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Booking already paid" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    //  Signature failed
    if (expectedSignature !== razorpay_signature) {
      booking.paymentStatus = "FAILED";
      await booking.save({ session });

      const transaction = await transactionModel.findOneAndUpdate(
        { bookingId: booking._id, razorpayOrderId: razorpay_order_id },
        {
          status: "FAILED", 
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
        { new: true, session },
      );

      booking.transactionId = transaction?._id; 

      await session.commitTransaction();
      session.endSession();

      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    // Signature success
    const transaction = await transactionModel.findOneAndUpdate(
      { bookingId: booking._id, razorpayOrderId: razorpay_order_id },
      {
        status: "SUCCESS",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      { new: true, session },
    );

    booking.transactionId = transaction?._id; 

    booking.paymentMethod = "RAZORPAY";
    booking.paymentStatus = "PAID";
    booking.bookingStatus = "UPCOMING";
    booking.paidAt = new Date();
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    await settlementService.settleBookingCommission(booking._id);

    await sendNotificationToUserOnServiceBooking(
      booking,
      booking.bookingStatus,
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: booking,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: err.message });
  }
};


// 3) COD
exports.payBookingByCOD = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId } = req.params;

    const booking = await bookingModel.findOne(
      { _id: bookingId, userId: req.user._id },
      null,
      { session },
    );

    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (booking.paymentStatus === "PAID") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Already paid" });
    }

    if (booking.bookingStatus === "CANCELLED") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Booking is cancelled" });
    }

    // Create COD transaction (PENDING)
    const transaction = await transactionModel.create(
      [
        {
          bookingId: booking._id,
          customerId: req.user._id,
          amount: booking.finalPayableAmount,
          currency: "INR",
          paymentMethod: "COD",
          status: "SUCCESS",
          walletType: "DEBIT",
          walletPurpose: "BOOKING_PAYMENT",
        },
      ],
      { session },
    );

    booking.transactionId = transaction[0]._id;

    booking.paymentMethod = "COD";
    booking.paymentStatus = "PAID";
    booking.bookingStatus = "UPCOMING";
    booking.paidAt = new Date();
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    await settlementService.settleBookingCommission(booking._id);

    await sendNotificationToUserOnServiceBooking(
      booking,
      booking.bookingStatus,
    );

    return res.status(200).json({
      success: true,
      message: "COD selected successfully",
      data: booking,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 4) Wallet Payment for Booking
// 4) Wallet Payment for Booking
exports.payBookingByWallet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId } = req.params;

    const booking = await bookingModel.findOne(
      { _id: bookingId, userId: req.user._id },
      null,
      { session },
    );

    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (booking.paymentStatus === "PAID") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Booking already paid" });
    }

    if (booking.bookingStatus === "CANCELLED") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Booking is cancelled" });
    }

    const amountToPay = Number(booking.finalPayableAmount);

    let wallet = await walletModel.findOne({ customerId: req.user._id }, null, {
      session,
    });

    if (!wallet) {
      wallet = await walletModel.create(
        [
          {
            customerId: req.user._id,
            balance: 0,
          },
        ],
        { session },
      );
      wallet = wallet[0];
    }

    if (wallet.balance < amountToPay) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Your balance is ₹${wallet.balance}`,
      });
    }

    //  Create transaction as CREATED
    const transaction = await transactionModel.create(
      [
        {
          bookingId: booking._id,
          customerId: req.user._id,
          amount: amountToPay,
          currency: "INR",
          paymentMethod: "WALLET",
          status: "SUCCESS",
          walletType: "DEBIT",
          walletPurpose: "BOOKING_PAYMENT",
        },
      ],
      { session },
    );

    booking.transactionId = transaction[0]._id;

    // ✅ Deduct wallet balance
    wallet.balance = wallet.balance - amountToPay;
    await wallet.save({ session });

    // ✅ Mark transaction SUCCESS
    await transactionModel.findByIdAndUpdate(
      transaction[0]._id,
      { status: "SUCCESS" },
      { session },
    );

    booking.paymentMethod = "WALLET";
    booking.paymentStatus = "PAID";
    booking.bookingStatus = "UPCOMING";
    booking.paidAt = new Date();
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    await settlementService.settleBookingCommission(booking._id);

    await sendNotificationToUserOnServiceBooking(
      booking,
      booking.bookingStatus,
    );

    return res.status(200).json({
      success: true,
      message: "Booking paid successfully using wallet",
      data: {
        booking,
        walletBalance: wallet.balance,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: err.message });
  }
};
