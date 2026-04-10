const mongoose = require("mongoose");

const bankSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
    },

    paymentType: {
      type: String,
      enum: ["BANK", "UPI"],
      required: true,
    },

    accountHolderName: {
      type: String,
      trim: true,
    },

    accountNumber: {
      type: String,
      select: false,
    },

    ifscCode: {
      type: String,
      uppercase: true,
    },

    bankName: {
      type: String,
    },

    branchName: {
      type: String,
    },

    upiId: {
      type: String,
      lowercase: true,
    },

    upiHolderName: {
      type: String,
      trim: true,
    },

    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 🔐 Index
bankSchema.index({ userId: 1, paymentType: 1 });

// ✅ BANK: last 4 digits virtual
bankSchema.virtual("accountLast4").get(function () {
  if (this.paymentType !== "BANK") return null;
  if (!this.accountNumber) return null;
  return String(this.accountNumber).slice(-4);
});

// enable virtuals
bankSchema.set("toJSON", { virtuals: true });
bankSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Bank", bankSchema);
