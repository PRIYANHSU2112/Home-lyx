const mongoose = require("mongoose");
let ObjectId = mongoose.Types.ObjectId;

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      ref: "userModel",
      required: true,
    },

    subCategoryId: {
      type: ObjectId,
      ref: "categoryModel", // service (sub-category)
      required: true,
    },

    numberOfFloors: {
      type: Number,
      required: true,
      min: 1,
    },

    pricePerFloor: {
      type: Number, // snapshot from category.price
      required: true,
    },

    totalAmount: {
      type: Number, // pricePerFloor * numberOfFloors
      required: true,
    },

    couponCode: {
      type: String,
      default: null,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    taxId: {
      type: ObjectId,
      ref: "taxModel",
      default: null,
    },

    taxPercent: {
      type: Number,
      default: 0,
    },

    taxAmount: {
      type: Number,
      default: 0,
    },

    finalPayableAmount: {
      type: Number,
      required: true,
    },

    partnerId: {
      type: ObjectId,
      ref: "userModel",
      default: null,
    },

    adminCharge: {
      type: Number,
      default: 0,
    },

    adminChargeAmount: {
      type: Number,
      default: 0,
    },

    commissionSettled: {
      type: Boolean,
      default: false,
    },

    partnerBookingStatus: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "COMPLETED"],
      default: "PENDING",
    },

    partnerAcceptedAt: {
      type: Date,
      default: null,
    },

    partnerRejectReason: {
      type: String,
      default: null,
    },

    serviceDate: {
      type: Date,
      required: true,
    },

    serviceTimeSlot: {
      type: String,
      required: true,
    },
    serviceDateTime: {
      type: Date,
    },

    oneDayReminderSent: {
      type: Boolean,
      default: false,
    },

    twoHourReminderSent: {
      type: Boolean,
      default: false,
    },

    serviceLocation: {
      address: {
        type: String,
        required: true,
      },
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },

    bookingStatus: {
      type: String,
      enum: ["PENDING", "UPCOMING", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },

    paymentMethod: {
      type: String,
      enum: ["", "WALLET", "RAZORPAY", "COD"],
      default: "",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },

    platformFee: {
      type: Number,
      default: 0,
    },

    transactionId: {
      type: mongoose.Types.ObjectId,
      ref: "transactionModel",
      default: null,
    },

    cancelledBy: {
      type: String,
      enum: ["USER", "ADMIN", "PARTNER", null],
      default: null,
    },

    cancelReason: {
      type: String,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    paymentFailedReason: { type: String, default: null },

    paidAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("bookingModel", bookingSchema);
