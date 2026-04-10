const mongoose = require("mongoose");
let objectId = mongoose.Types.ObjectId;
const ecommerceCategoryModel = new mongoose.Schema(
  {
    name: String,
    icon: {
      type: String,
      default: "/public/images/Default-Img.jpg",
    },
    banner: [
      {
        type: { type: String, enum: ["IMAGE", "VIDEO"], default: "IMAGE" },
        url: { type: String, default: "/public/images/Default-Img.jpg" },
      },
    ],
    pCategory: { type: objectId, ref: "eCommerceCategoryModel", default: null },
    disable: { type: Boolean, default: false },

    slug: {
      type: String,
    },
    adminCommission: { type: Number, default: 1 },
  },
  { timestamps: true },
);

// Add indexes for better query performance
ecommerceCategoryModel.index({ slug: 1 });
ecommerceCategoryModel.index({ pCategory: 1, disable: 1 });
ecommerceCategoryModel.index({ disable: 1 });
ecommerceCategoryModel.index({ createdAt: -1 });

module.exports = mongoose.model(
  "eCommerceCategoryModel",
  ecommerceCategoryModel,
);
