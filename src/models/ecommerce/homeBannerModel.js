const mongoose = require("mongoose");

const eCommerceHomeBannerModel = new mongoose.Schema(
  {
    title: String,
    banner: String,
    disable:{
      type:Boolean,
      default:false
    }
  },
  { timestamps: true }
);

// Add indexes for better query performance
eCommerceHomeBannerModel.index({ disable: 1 });
eCommerceHomeBannerModel.index({ createdAt: -1 });

module.exports = mongoose.model("E-CommerceHomeBannerModel", eCommerceHomeBannerModel);
