const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Types.ObjectId,
      ref: "orderModel",
      default: null,
      // required: true,
    },

    bookingId: {
      type: mongoose.Types.ObjectId,
      ref: "bookingModel",
      default: null,
    },

    customerId: {
      type: mongoose.Types.ObjectId,
      ref: "userModel",
    },

    amount: Number,

    currency: {
      type: String,
      default: "INR",
    },

    paymentGateway: {
      type: String,
      enum: ["RAZORPAY"],
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,

    paymentMethod: {
      type: String,
      enum: ["UPI", "CARD", "NETBANKING", "WALLET", "COD", "ONLINE"],
    },

    status: {
      type: String,
      enum: ["CREATED", "SUCCESS", "FAILED", "REFUNDED","PENDING"],
      default: "FAILED",
    },
    paymentSessionId: String,

    walletType: {
      type: String,
      enum: ["CREDIT", "DEBIT", null],
      default: null,
    },

    walletPurpose: {
      type: String,
      enum: ["TOPUP", "ORDER_PAYMENT", "BOOKING_PAYMENT", "REFUND", null],
      default: null,
    },

    // rawResponse: {}, // webhook / gateway response
  },
  { timestamps: true },
);

// Add indexes for better query performance
transactionSchema.index(
  { razorpayOrderId: 1 },
  { sparse: true }
);
transactionSchema.index({ customerId: 1, createdAt: -1 });
transactionSchema.index({ orderId: 1 });
transactionSchema.index({ bookingId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ paymentMethod: 1 });

transactionSchema.pre("save", function (next) {
  const isOrderOrBooking = this.orderId || this.bookingId;
  const isWalletTopup =
    this.paymentMethod === "WALLET" && this.walletPurpose === "TOPUP";

  if (!isOrderOrBooking && !isWalletTopup) {
    return next(
      new Error("Either orderId/bookingId OR wallet topup is required"),
    );
  }

  next();
});

module.exports = mongoose.model("transactionModel", transactionSchema);
