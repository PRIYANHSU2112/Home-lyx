const mongoose = require("mongoose");
let objectId = mongoose.Types.ObjectId;
const categoryModel = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      default: "/public/images/Default-Img.jpg",
    },
    banner: [
      {
        type: {
          type: String,
          enum: ["IMAGE", "VIDEO"],
        },
        url: {
          type: String,
          default: "/public/images/Default-Img.jpg",
        },
      },
    ],
    cityId: [
      {
        type: objectId,
        ref: "cityModel",
      },
    ],
    pCategory: {
      type: objectId,
      ref: "categoryModel",
      default: null,
    },
    disable: {
      type: Boolean,
      default: false,
    },
    slug: {
      type: String,
    },

    price: {
      type: Number,

      default: 0,
    },

    status: {
      type: String,
    },

    description: {
      type: String,
    },

    workExperience: {
      type: Number,
    },

    images: [
      {
        type: String, // image key/url
      },
    ],

    videos: [
      {
        type: String, // video key/url
      },
    ],
    totalRating: {
      type: Number,
      default: 0,
    },
    avgRating: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        userId: {
          type: objectId,
          ref: "userModel",
          required: true,
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    partnerId: {
      type: objectId,
      ref: "userModel",
      default: null,
    },
    categoryStatus: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("categoryModel", categoryModel);