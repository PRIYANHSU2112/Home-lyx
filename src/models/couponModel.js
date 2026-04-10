const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const couponSchema = new mongoose.Schema(
  {
    couponName: {
      type: String,
      required: true,
    },

    couponCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    /* ---------- DISCOUNT ---------- */
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FLAT"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
    },

    maxDiscountPrice: {
      type: Number,
    },

    /* ---------- APPLY ON ---------- */
    applyOn: [
      {
        type: String,
        enum: ["SERVICE", "ECOMMERCE"],
        required: true,
      },
    ],

    /* ---------- OPTIONAL CATEGORY ---------- */
    categoryId: [{ type: ObjectId, ref: "categoryModel" }],
    eComCategoryId: [{ type: ObjectId, ref: "eCommerceCategoryModel" }],

    minOrderPrice: {
      type: Number,
      required: true,
    },

    couponQuantity: {
      type: Number,
      required: true,
    },

    startDate: Date,
    expiryDate: Date,
    validity: Number,

    icon: String,
    backgroundColourCode: String,
    taskColourCode: String,

    disable: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
couponSchema.index({ couponCode: 1,disable: 1, applyOn: 1, startDate: 1, expiryDate: 1  });
couponSchema.index({ _id: 1, disable: 1, applyOn: 1, startDate: 1, expiryDate: 1 });

module.exports = mongoose.model("coupon", couponSchema);
