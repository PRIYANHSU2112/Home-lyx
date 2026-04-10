const mongoose = require("mongoose");
const productModel = require("../models/ecommerce/productModel");

/**
 * Update variant stock & sold safely
 * @param {Array} products - order.product array
 * @param {Number} stockMultiplier - +1 or -1
 * @param {Number} soldMultiplier - +1 or -1
 */
const  updateVariantStockAndSold = async (
  products,
  stockMultiplier,
  soldMultiplier
) => {
  for (const item of products) {
    const updatedProduct = await productModel.findOneAndUpdate(
      { _id: item.productId._id },
      {
        $inc: {
          "variants.$[v].stock": stockMultiplier * item.quantity,
          "variants.$[v].sold": soldMultiplier * item.quantity,

            sold: soldMultiplier * item.quantity,
        },
      },
      {
        arrayFilters: [
          {
            "v._id": new mongoose.Types.ObjectId(item.variantId),
          },
        ],
        new: true,
      }
    );

    if (!updatedProduct) {
      throw new Error("VARIANT_STOCK_UPDATE_FAILED");
    }
  }
};

module.exports = {
  updateVariantStockAndSold,
};
