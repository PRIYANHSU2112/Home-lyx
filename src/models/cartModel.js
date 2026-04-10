const mongoose = require("mongoose");
let objectId = mongoose.Types.ObjectId;

const cartModel = new mongoose.Schema(
  {
    customerId: { type: objectId, ref: "userModel" },
    productId: { type: objectId, ref: "productModel" },
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    image: String,
  },
  { timestamps: true }
);
module.exports = mongoose.model("cartModel", cartModel);
