const mongoose = require("mongoose");
let objectId = mongoose.Types.ObjectId;
const productModel = new mongoose.Schema(
  {
    images: [
      {
        type: { type: String, enum: ["IMAGE", "VIDEO"] },
        url: { type: String },
      },
    ],
    title: { type: String },
    description: String,
    price: { type: Number },
    time: { type: String },
    include: [String],
    exclude: [String],
    warranty: Number,
    rateCard: { type: objectId, ref: "" },
    additional: [
      {
        type: { type: String, enum: ["IMAGE", "VIDEO"] },
        url: { type: String },
      },
    ],
    taxId: { type: objectId, ref: "taxModel" },
    categoryId: { type: objectId, ref: "categoryModel" },
    cityId: { type: objectId, ref: "cityModel" },
    subtitle: { type: String },
    mrp: { type: Number },
    thumnail: { type: String },
    disable: { type: Boolean, default: false },
    reviewRating: { type: Number, default: 0 },
    sku: { type: String, unique: true },
	meta: {
      title: { type: String ,default: "Product"},
      description: { type: String,default: "Product" },
      keywords: { type: [String],default: ["Product"] },
    },
    slug: {
    type: String,
  },
  },
  { timestamps: true }
);

module.exports = mongoose.model("productModel", productModel);
