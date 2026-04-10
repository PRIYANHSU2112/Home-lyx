const mongoose = require("mongoose");

const appBannerModel = new mongoose.Schema(
  {
    banner: String,
  },
  { timestamps: true }
);
module.exports = mongoose.model("appBannerModel", appBannerModel);
