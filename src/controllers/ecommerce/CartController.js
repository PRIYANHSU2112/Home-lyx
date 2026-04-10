const cartModel = require("../../models/ecommerce/CartModel");
const productModel = require("../../models/ecommerce/productModel");
const orderModel = require("../../models/ecommerce/orderModel");
const mongoose = require("mongoose");
exports.getCartId = async (req, res, next, id) => {
  try {
    let cart = await cartModel.findById(id).populate("items.product");
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "cart Not Found",
      });
    } else {
      (req.Cart = cart), next();
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================= Create Cart ============================ ||

exports.createCart = async (req, res) => {
  try {
    const data = req.body;
    const { quantity } = req.body;
    if (!data.customerId) {
      return res
        .status(400)
        .json({ success: false, message: "customerId Is Required..." });
    }
    if (!data.productId) {
      return res
        .status(400)
        .json({ success: false, message: "productId Is Required..." });
    }
    if (!data.variantId) {
      return res
        .status(400)
        .json({ success: false, message: "variantId Is Required..." });
    }

    const product = await productModel.findById(data.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const variant = product.variants.id(data.variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found"
      });
    }


    if (variant.stock === 0) {
      return res.status(404).json({
        success: false,
        message: "Product is sold Out"
      });
    }



    let cart = await cartModel.findOne({ customerId: req.body.customerId, });

    if (!cart) {
      cart = await cartModel.create({ customerId: data.customerId, items: [] })
    }

    // check same varient in same product
    const itemIndex = cart.items.findIndex(item => item.variant.toString() === data.variantId);

    const unitprice = variant.price;
    const totalPrice = unitprice * quantity;

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
      cart.items[itemIndex].totalPrice = cart.items[itemIndex].quantity * unitprice
    } else {
      cart.items.push({
        product: data.productId,
        variant: data.variantId,
        quantity,
        unitPrice: unitprice,
        totalPrice
      })
    }

    console.log(totalPrice)
    cart.cartTotal = cart.items.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    )
    await cart.save();
    return res.status(201).json({
      success: true,
      message: "Add To Cart Successfuly...",
      data: cart,
    });

  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
    console.log(error.stack)
  }
};

// =============================get Cart by user =================================||
// controllers/cartController.js

exports.getCart = async (req, res) => {
  try {

    const cart = await cartModel.findOne({ customerId: req.User._id })
      .sort({ createdAt: -1 })
      .populate("items.product")

    // If no cart or empty cart
    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        data: {
          items: [],
          cartTotal: 0
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      data: cart
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ============================ Get All Cart By User Id ========================= ||

exports.getAllCartBycustomerId = async (req, res) => {
  try {
    const billDetail = {
      netAmount: req.netAmount,                 // Item Total
      taxAmount: req.taxAmount,                 // GST Amount
      taxPercentage: req.taxPercentage,         // GST % (null / mixed)

      deliveryPartnerFee: req.deliveryPartnerFee || 0,
      platformFee: req.platformFee || 0,

      couponCode: req.couponCode,
      couponDiscount: req.couponDiscount,
      totalOfferDiscount: req.totalOfferDiscount,

      orderTotal: req.orderTotal                // Final Payable
    };


    // const bestShaller = await orderModel.aggregate([
    //   {
    //     $match: {
    //       status: "ORDERED"   // recommended over ORDERED
    //     }
    //   },

    //   {
    //     $unwind: "$product"
    //   },

    //   {
    //     $group: {
    //       _id: "$product.productId",
    //       totalSold: { $sum: "$product.quantity" },
    //       last30DaysSold: {
    //         $sum: {
    //           $cond: [
    //             {
    //               $gte: [
    //                 "$createdAt",
    //                 {
    //                   $dateSubtract: {
    //                     startDate: "$$NOW",
    //                     unit: "day",
    //                     amount: 30
    //                   }
    //                 }
    //               ]
    //             },
    //             "$product.quantity",
    //             0
    //           ]
    //         }
    //       }
    //     }
    //   },

    //   {
    //     $addFields: {
    //       bestSellerScore: {
    //         $add: [
    //           { $multiply: ["$last30DaysSold", 3] },
    //           { $multiply: ["$totalSold", 1] }
    //         ]
    //       }
    //     }
    //   },

    //   { $sort: { bestSellerScore: -1 } },

    //   { $limit: 10 },   //  ONLY BEST SELLER

    //   {
    //     $lookup: {
    //       from: "ecommerceproductmodels",
    //       localField: "_id",
    //       foreignField: "_id",
    //       as: "productDetails"
    //     }
    //   },

    //   { $unwind: "$productDetails" },

    //   {
    //     $project: {
    //       _id: 0,
    //       productId: "$productDetails._id",
    //       title: "$productDetails.title",
    //       brandName: "$productDetails.brandName",
    //       rating: "$productDetails.reviewRating",
    //       variant: {
    //         $arrayElemAt: ["$productDetails.variants", 0],
    //       },
    //       features:"$productDetails.features",
    //       images: "$productDetails.images",
    //       thumnail: "$productDetails.thumnail",
    //       slug: "$productDetails.slug"
    //     }
    //   }
    // ])


    return res.status(200).json({
      success: true,
      isSuccess: req.success,
      message: "Cart fetched successfully",
      isMessage: req.message,
      data: req.Cart
        ? {
          cartData: req.Cart,
          billDetail,
          // bestShaller
        }
        : null
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.quantityUpdate = async (req, res) => {
  try {

    const { variantId, customerId } = req.params;
    const { action } = req.body; // INCREASE | DECREASE
    console.log(customerId)
    const cart = await cartModel.findOne({ customerId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    const item = cart.items.find(
      i => i.variant.toString() === variantId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      });
    }

    const product = await productModel.findById(item.product);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found"
      });
    }

    // check incriment
    if (action === 'INCREASE') {


      if (item.quantity + 1 > variant.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${variant.stock} items left in stock`
        });
      }

      // increment

      item.quantity += 1;
      item.totalPrice = item.unitPrice * item.quantity
    }

    //check decriment
    if (action === "DECREASE") {
      if (item.quantity <= 1) {
        return res.status(400).json({
          success: false,
          message: "Minimum quantity is 1"
        });
      }
      item.quantity -= 1
      item.totalPrice = item.unitPrice * item.quantity;

    }
    //  cart total re calculte
    cart.cartTotal = cart.items.reduce(
      (sum, i) => sum + i.totalPrice,
      0
    );

    await cart.save();
    return res.status(200).json({
      success: true,
      message: "Quantity Update Successfully...",
      data: cart,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};


exports.deleteCustomerCart = async (req, res) => {
  try {
    const Cart = await cartModel.findOne({ customerId: req.User._id });
    const { variantId } = req.params;

    if (!Cart) {
      return res
        .status(400)
        .json({ success: false, message: "Cart Not Found" });
    }

    const itemIndex = Cart.items.findIndex(i => i.variant.toString() === variantId);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      });
    }

    Cart.items.splice(itemIndex, 1);

    Cart.cartTotal = Cart.items.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );


    await Cart.save();
    return res.status(200).json({
      success: true,
      message: "Cart Item Delete Successfully.....",
      data: Cart,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

exports.deleteCartById = async (req, res) => {
  try {

    let updateCart = await cartModel.deleteOne({ _id: req.Cart._id });
    return res.status(200).json({
      success: true,
      message: "Cart Delete Successfully.....",
      data: updateCart,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};



// ======================= Create DummyCart ============================ ||

exports.createDummyCart = async (req, res) => {
  try {
    const data = req.body;
    let objectId;
    if (!data.customerId) {
      objectId = new mongoose.Types.ObjectId();
    }
    if (!data.productId) {
      return res
        .status(400)
        .json({ success: false, message: "productId Is Required..." });
    }
    let a = await cartModel.findOne({
      customerId: req.body.customerId ? req.body.customerId : objectId,
      productId: req.body.productId,
    });
    if (a) {
      return res.status(200).json({
        success: true,
        message: "This Product Is All Ready In You Cart",
      });
    } else {
      let Product = await productModel.findOne({ _id: data.productId });
      let price = Product.price * 1;
      let Cart = await cartModel.create({
        price: price,
        customerId: data.customerId ? data.customerId : objectId,
        productId: data.productId,
      });
      return res.status(201).json({
        success: true,
        message: "Add To Cart Successfuly...",
        data: Cart,
      });
    }
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};