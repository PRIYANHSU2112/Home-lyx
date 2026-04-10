const mongoose = require("mongoose");

const privacyModel = new mongoose.Schema(
  {
    name: String,
    discription: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("privacyModel", privacyModel);
