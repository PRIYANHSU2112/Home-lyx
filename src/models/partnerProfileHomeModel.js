const mongoose = require("mongoose");

const partnerProfileHomeModel = new mongoose.Schema(
  {
    banner: String,
    link: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "partnerProfileHomeModel",
  partnerProfileHomeModel
);
