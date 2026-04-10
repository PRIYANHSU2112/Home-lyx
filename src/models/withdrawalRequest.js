const mongoose = require("mongoose");

const withdrawalRequestSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Types.ObjectId,
      ref: "partnerProfileModel",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
      default: "PENDING",
      index: true,
    },
    bankDetails: {
      accountHolderName: {
        type: String,
        trim: true,
      },
      accountNumber: {
        type: String,
        trim: true,
      },
      bankName: {
        type: String,
        trim: true,
      },
      ifscCode: {
        type: String,
        trim: true,
        uppercase: true,
      },
      upiId: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
      },
    },
    processedBy: {
      type: mongoose.Types.ObjectId,
      ref: "userModel",
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    transactionRef: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for query performance
withdrawalRequestSchema.index({ partnerId: 1, createdAt: -1 });
withdrawalRequestSchema.index({ status: 1 });
withdrawalRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model("withdrawalRequestModel", withdrawalRequestSchema);
