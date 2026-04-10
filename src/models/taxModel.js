const mongoose = require("mongoose");
const taxModel = mongoose.Schema(
  {
    taxPercent: Number,
  },
  { timeStamps: true }
);
module.exports = mongoose.model("taxModel", taxModel);
