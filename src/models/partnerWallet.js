const mongoose = require("mongoose");

const partnerWalletSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Types.ObjectId,
      ref: "partnerProfileModel",
      required: true,
      unique: true,
      index: true,
    },
    totalEarning: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastSettlementDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

partnerWalletSchema.index({ partnerId: 1 }, { unique: true });
partnerWalletSchema.index({ createdAt: -1 });
partnerWalletSchema.index({ balance: 1 });

module.exports = mongoose.model("partnerWalletModel", partnerWalletSchema);
