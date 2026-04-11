const mongoose = require("mongoose");
let objectId = mongoose.Types.ObjectId;
const { OrderEcommerce } = require("../../helper/status");
const orderModel = new mongoose.Schema(
  {
    customerId: { type: objectId, ref: "userModel" },
    product: [
      {
        productId: { type: objectId, ref: "eCommerceProductModel" },
        variantId: { type: objectId },
        warranty: Number,
        price: Number,
        quantity: Number,
        returnInDays: Number,
        taxPersent: Number,
        status: {
          type: String,
          enum: Object.values(OrderEcommerce),
          default: OrderEcommerce.PENDING,
        },
        indexStatus: Number,
        adminCommission: { type: Number }, // percentage at time of order
        commissionAmount: { type: Number }, // calculated value
      },
    ],
    orderTotal: Number,
    checkState: { type: Boolean, default: false },
    taxAmount: Number,
    couponeCode: {
      type: String,
      trim: true,
      default: null
    },
    couponeDiscount: Number,
    address: {},
    totalOfferDiscount: Number,
    transactionId: String,
    transactionRef: String,
    paymentMethod: {
      type: String,
      enum: ["ONLINE", "COD","WALLET"],
    },
    paymentSessionId: {
      type: String,
      index: true,
    },
    paymentFailedReason: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PAID", "UNPAID", "FAILED"],
      default: "UNPAID"
    },
    status: {
      type: String,
      enum: Object.values(OrderEcommerce),
      default: OrderEcommerce.PENDING,
    },
    netAmount: Number,
    memberShipId: {   
      type: objectId,
      ref: "membershipModel",
      default: null,
    },
    memberDiscount: Number,
    memberDiscountPercent: Number,
    invoice: String,
    reason: String,
    cancleBy: String,
    deliveredDate: Date,
    parentOrderId: { type: objectId, ref: "e-commorderModel", default: null },
    partnerId: { type: objectId, ref: "partnerProfileModel", default: null },
    orderId: { type: String, unique: true },
  },
  { timestamps: true }
);

// Add indexes for better query performance
orderModel.index({ customerId: 1, createdAt: -1 });
orderModel.index({ status: 1 });
orderModel.index({ paymentStatus: 1 });
orderModel.index({ customerId: 1, status: 1 });
orderModel.index({ createdAt: -1 });
orderModel.index({ orderId: 1 });
orderModel.index({ partnerId: 1 });

// Ensure statuses are valid before validation to avoid enum conflicts
// orderModel.pre('validate', function (next) {
//   try {
//     const validStatuses = Object.values(OrderEcommerce);

//     // Normalize top-level status
//     if (typeof this.status === 'string') {
//       const normalized = this.status.trim().toUpperCase();
//       if (normalized === 'ORDERD') {
//         this.status = OrderEcommerce.ORDERED;
//       } else if (!validStatuses.includes(normalized) && validStatuses.includes(this.status)) {
//         // keep original case if already valid
//       } else if (!validStatuses.includes(this.status)) {
//         this.status = OrderEcommerce.PENDING;
//       }
//     } else if (!validStatuses.includes(this.status)) {
//       this.status = OrderEcommerce.PENDING;
//     }

//     // Normalize product item statuses
//     if (Array.isArray(this.product)) {
//       this.product.forEach((p) => {
//         if (typeof p.status === 'string') {
//           const s = p.status.trim().toUpperCase();
//           if (s === 'ORDERD') p.status = OrderEcommerce.ORDERED;
//           else if (!validStatuses.includes(s)) p.status = OrderEcommerce.PENDING;
//           else p.status = s; // ensure consistent casing
//         } else {
//           p.status = OrderEcommerce.PENDING;
//         }
//       });
//     }
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

module.exports = mongoose.model("e-commorderModel", orderModel);
