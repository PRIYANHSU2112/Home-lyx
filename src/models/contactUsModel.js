const mongoose = require("mongoose");

const contactUsModel = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    mobile: Number,
    discription: String,
    type: {
      type: String,
      enum: ["CUSTOMER", "PARTNER"],
      default: "CUSTOMER",
    },
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partnerProfileModel",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("contactUsModel", contactUsModel);
