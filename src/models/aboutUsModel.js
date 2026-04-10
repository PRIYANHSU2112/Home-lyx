const mongoose = require("mongoose");

const aboutUsModel = new mongoose.Schema(
  {
    name: String,
    title: String,
    discription: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("aboutUsModel", aboutUsModel);
