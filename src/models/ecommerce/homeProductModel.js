const mongoose = require("mongoose");

const eCommerceCategoryProductModel = new mongoose.Schema(
  {
    title: String,
    description: String,
    products: [
      {
        type: mongoose.Types.ObjectId,
        ref: "eCommerceProductModel",
      },
    ],
  },
  { timestamps: true }
);

// Add indexes for better query performance
eCommerceCategoryProductModel.index({ createdAt: -1 });
eCommerceCategoryProductModel.index({ title: "text", description: "text" });

module.exports = mongoose.model(
  "E-CommerceCategoryProductModel",
  eCommerceCategoryProductModel
);
