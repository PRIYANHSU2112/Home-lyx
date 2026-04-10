const mongoose = require("mongoose");

const categoryProductModel = new mongoose.Schema(
  {
    title: String,
    description: String,
    products: [{
      type: mongoose.Types.ObjectId ,ref: "productModel"
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("categoryProductModel", categoryProductModel);
