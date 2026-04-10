const mongoose = require("mongoose");

const homeBannerModel = new mongoose.Schema(
  {
    title: String,
    banner: String,
  },
  { timestamps: true }
);
module.exports = mongoose.model("homeBannerModel", homeBannerModel);
