const mongoose = require("mongoose");
let objectId = mongoose.Types.ObjectId;

const variantSchema = new mongoose.Schema(
  {
    size: {
      type: String, // 1L, 4L, 10L
    },
    price: {
      type: Number,
    },
    mrp: {
      type: Number,
    },
    discount: {
      type: Number,
    },
    stock: {
      type: Number, // quantity
      default: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
  },
  { _id: true },
);

const productModel = new mongoose.Schema(
  {
    images: [
      {
        type: { type: String, enum: ["IMAGE", "VIDEO"], default: "IMAGE" },
        url: { type: String, default: "public/images/product-default-img.jpg" },
      },
    ],
    title: { type: String },
    subtitle: { type: String },
    discount: { type: Number }, // in percentage
    time: { type: String },
    features: [String],
    warranty: Number,
    additional: [
      {
        type: { type: String, enum: ["IMAGE", "VIDEO"] },
        url: { type: String },
      },
    ],
    categoryId: { type: objectId, ref: "eCommerceCategoryModel" },
    taxId: { type: objectId, ref: "taxModel" },
    taxPercent: {
      type: Number,
      default: 0,
    },
    thumnail: {
      type: String,
      default: "public/images/product-default-img.jpg",
    },
    disable: { type: Boolean, default: false },
    stock: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    brandId: { type: objectId, ref: "eCommerceBrandModel" },
    brandName: { type: String },
    reviewRating: { type: Number, default: 0 },
    sku: { type: String, unique: true },
    returnInDays: Number,
    meta: {
      title: { type: String, default: "Product" },
      description: { type: String, default: "Product" },
      keywords: { type: [String], default: ["Product"] },
    },
    highlights: [
      {
        type: String, // Premium, Washable, Luxury Finish
        trim: true,
      },
    ],
    description: {
      type: String,
    },
    specifications: {
      type: String,
      trim: true,
      default: "",
    },
    variants: {
      type: [variantSchema],
      required: true,
    },
    slug: {
      type: String,
    },
    partnerId: { type: objectId, ref: "partnerProfileModel" },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    reason: { type: String, default: "" },
    wishlist: [
      {
        type: objectId,
        ref: "eCommerceProductModel",
      },
    ],
  },
  { timestamps: true },
);

// Add indexes for better query performance
productModel.index({ categoryId: 1, disable: 1 });
productModel.index({ slug: 1 });
productModel.index({ brandId: 1 });
productModel.index({ disable: 1 });
productModel.index({ createdAt: -1 });
productModel.index({ sku: 1 }, { sparse: true });
productModel.index({ title: "text", subtitle: "text", description: "text" }); // Text search index

module.exports = mongoose.model("eCommerceProductModel", productModel);
