const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: ObjectId,
      ref: "bookingModel",
      required: true,
      // unique: true, // one review per booking
    },

    subCategoryId: {
      type: ObjectId,
      ref: "categoryModel",
      required: true, //  NOT unique
    },

    userId: {
      type: ObjectId,
      ref: "userModel",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
      default: "",
    },

    disable: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// optional performance indexes
reviewSchema.index({ subCategoryId: 1 });
reviewSchema.index({ userId: 1 });

module.exports = mongoose.model("reviewModel", reviewSchema);
