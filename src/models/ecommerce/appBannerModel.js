const mongoose = require("mongoose");

const ecommerceAppBannerModel = new mongoose.Schema(
  {
    banner: String,
  },
  { timestamps: true }
);

// Add indexes for better query performance
ecommerceAppBannerModel.index({ createdAt: -1 });

module.exports = mongoose.model(
  "e-commerceAppBannerModel",
  ecommerceAppBannerModel
);
