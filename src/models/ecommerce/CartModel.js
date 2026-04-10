const mongoose = require("mongoose");
let ObjectId = mongoose.Types.ObjectId;

const ecommerceCartModel = new mongoose.Schema(
  {
    customerId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
      // required: true,
      // unique: true
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "eCommerceProductModel",
          required: true
        },

        variant: {
          type: mongoose.Schema.Types.ObjectId,
          required: true
        },

        quantity: {
          type: Number,
          min: 1,
          default: 1
        },

        unitPrice: {
          type: Number,
          required: true
        },

        totalPrice: {
          type: Number,
          required: true
        }
      }
    ],

    cartTotal: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

ecommerceCartModel.index({ customerId: 1 });
module.exports = mongoose.model("eCommerceCartModel", ecommerceCartModel);
