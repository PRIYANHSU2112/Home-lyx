const mongoose = require("mongoose");
let objectId = mongoose.Types.ObjectId;
const { OrderService } = require("../helper/status");
const orderModel = new mongoose.Schema(
  {
    customerId: { type: objectId, ref: "userModel" },
    product: [
      {
        productId: { type: objectId, ref: "productModel" },
        price: Number,
        quantity: Number,
        taxPersent: Number,
        image: String,
      },
    ],
    partnerId: { type: objectId, ref: "userModel" },
    cityId: { type: objectId, ref: "cityModel" },
    orderTotal: Number,
    taxAmount: Number,
    couponeCode: Number,
    couponeDiscount: Number,
    checkState: { type: Boolean, default: false },
    address: {},
    time: String,
    date: String,
    totalOfferDiscount: Number,
    transactionId: String,
    transactionRef: String,
    paymentMethod: { 
      type: String,
      enum: ["ONLINE", "COD", "PAYMENT_ACCEPTED_ADMIN"],
    },
    paymentStatus: {
      type: String,
      enum: ["PAID", "UNPAID", "FAILED"],
      default: "UNPAID"
    },
    status: {
      type: String,
      enum: Object.values(OrderService),
      default: OrderService.PENDING,
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
    workingOtp: Number,
    completedOtp: Number,
    reason: String,
    afterWorkingImage: [String],
    beforeWorkingImage: [String],
    sparePartsAmount: Number,
    transportAmount: Number,
    courierAmount: Number,
    remark: String,
    cancleBy: {  
      type: String,
    enum: ["COSTOMER", "PATNER", "ADMIN", "SUPER_ADMIN", "SUB_ADMIN"],
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("orderModel", orderModel);
