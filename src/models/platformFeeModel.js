const mongoose = require("mongoose");

const platformFeeSchema = new mongoose.Schema(
  {
    minAmount: {
      type: Number,
      required: true,
    },
    maxAmount: {
      type: Number,
      default: null, // null means no upper limit
    },
    fee: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("platformFee", platformFeeSchema);

