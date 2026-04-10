const mongoose = require("mongoose");

const shipingModel = new mongoose.Schema(
  {
    name: String,
    charge: Number,
  },
  { timestamps: true }
);
// Add indexes for better query performance
shipingModel.index({ createdAt: -1 });
module.exports = mongoose.model("shipingModel", shipingModel);