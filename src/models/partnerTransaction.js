const mongoose = require("mongoose");

const partnerTransactionSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Types.ObjectId,
      ref: "partnerProfileModel",
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Types.ObjectId,
      ref: "e-commorderModel",
      default: null,
      index: true,
    },
    bookingId: {
      type: mongoose.Types.ObjectId,
      ref: "bookingModel",
      default: null,
      index: true,
    },
    orderType: {
      type: String,
      enum: ["ECOMMERCE", "SERVICE","NULL"],
      default: "NULL",
    },
    amount: {
      type: Number,
      default: 0,
    },
    commissionPercentage: {
      type: Number,
      default: 0,
    },
    commissionAmount: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      default: 0,
    },
    transactionType: {
      type: String,
      enum: ["COMMISSION_EARNED", "WITHDRAWAL_REQUESTED", "WITHDRAWAL_APPROVED", "WITHDRAWAL_REJECTED", "REFUND_CREDIT"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SETTLED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"],
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    withdrawalId: {
      type: mongoose.Types.ObjectId,
      ref: "withdrawalRequestModel",
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for query performance
partnerTransactionSchema.index({ partnerId: 1, createdAt: -1 });
partnerTransactionSchema.index({ orderId: 1 });
partnerTransactionSchema.index({ bookingId: 1 });
partnerTransactionSchema.index({ status: 1 });
partnerTransactionSchema.index({ transactionType: 1 });
partnerTransactionSchema.index({ partnerId: 1, transactionType: 1 });
partnerTransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("partnerTransactionModel", partnerTransactionSchema);
