// models/refund.model.js
const mongoose = require("mongoose");
let ObjectId = mongoose.Types.ObjectId;

const refundSchema = new mongoose.Schema(
  {
    // 🔹 Common
    userId: {
      type: ObjectId,
      ref: "userModel",
      required: true,
    },

    refundFor: {
      type: String,
      enum: ["ECOMMERS", "SERVICES"],
      required: true,
    },

    netAmount: {
      type: Number,
    },
    refundAmount: {
      type: Number,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
      default: "PENDING",
    },

    // 🔹 Bank Details (manual refund)
    bankDetails: {
      accountHolderName: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      branchName: String,
    },
    upi: {
      upiId: String,
      upiHolderName: String,
    },
    // 🔹 Admin
    adminRemark: {
      type: String,
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },

    // ======================
    // 🔹 ORDER REFUND FIELDS
    // ======================
    orderId: {
      type: ObjectId,
      ref: "e-commorderModel",
      default: null,
    },

    // ======================
    // 🔹 BOOKING REFUND FIELDS
    // ======================
    bookingId: {
      type: ObjectId,
      ref: "bookingModel",
      default: null,
    },

    // 🔹 Payment reference
    paymentMethod: {
      type: String,
      enum: ["WALLET", "RAZORPAY", "COD", "ONLINE",null],
      default: null,
    },

    transactionId: {
      type: String,
      default: null,
    },
    transactionRef: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    refundTransactionId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// 🔐 Indexes (important)
refundSchema.index({ userId: 1, createdAt: -1 });
refundSchema.index({ refundFor: 1, status: 1 });
refundSchema.index({ orderId: 1 });
refundSchema.index({ bookingId: 1 });

module.exports = mongoose.model("refundModel", refundSchema);
