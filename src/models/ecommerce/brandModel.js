const mongoose = require("mongoose");

const ecommerceBrandModel = new mongoose.Schema(
  {
    name: String,
    image: String,
    disable: { type: Boolean, default: false },
    categoryId: { type: mongoose.Types.ObjectId, ref: "eCommerceCategoryModel" },
  },
  { timestamps: true }
);

// Add indexes for better query performance
ecommerceBrandModel.index({ categoryId: 1, disable: 1 });
ecommerceBrandModel.index({ disable: 1 });
ecommerceBrandModel.index({ createdAt: -1 });

module.exports = mongoose.model("eCommerceBrandModel", ecommerceBrandModel);
