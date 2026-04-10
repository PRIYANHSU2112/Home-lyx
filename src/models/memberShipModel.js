const mongoose = require("mongoose");
const membershipModel = mongoose.Schema(
  {
    title: String,
    subtitle: String,
    logo: String,
    features: [String],
    price: Number,
    durationInMonth: Number,
    discountPercent: Number,
    disable: { type: Boolean, default: false },
  },
  { timestamps: true }
);
module.exports = mongoose.model("membershipModel", membershipModel);
