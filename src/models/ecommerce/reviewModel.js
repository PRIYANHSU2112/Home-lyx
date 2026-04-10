const mongoose = require("mongoose");
let objectId = mongoose.Types.ObjectId;
const ecommercereviewModel = new mongoose.Schema(
  {
    userId: { type: objectId, ref: "userModel" },
    productId: { type: objectId, ref: "productModel" },
    orderId: { type: objectId, ref: "e-commerceorderModel" },
    comment: { type: String },
    rating: { type: Number, default: 1, max: 5, min: 1 },
    disable: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Add indexes for better query performance
ecommercereviewModel.index({ productId: 1, disable: 1 });
ecommercereviewModel.index({ userId: 1 });
ecommercereviewModel.index({ orderId: 1 });
ecommercereviewModel.index({ createdAt: -1 });

module.exports = mongoose.model("e-commercereviewModel", ecommercereviewModel);
