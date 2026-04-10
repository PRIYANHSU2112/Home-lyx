const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const {
  deleteFileFromObjectStorage,
} = require("../midellwares/multerMidellware");
const mongoose = require("mongoose");

exports.getCartId = async (req, res, next, id) => {
  try {
    let cart = await cartModel.findById(id).populate("productId");
    if (!cart) {
      return res.status(404).json({
        success: true,
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
    let image = req.file ? req.file.key : null;
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
    let a = await cartModel.findOne({
      customerId: req.body.customerId,
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
        customerId: data.customerId,
        productId: data.productId,
        // categoryId: data.categoryId,
        image: image,
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

// ============================ Get All Cart By User Id ========================= ||

exports.getAllCartBycustomerId = async (req, res) => {
  try {
    const billDetail = {};
    billDetail.netAmount = req.netAmount;
    billDetail.membershipDiscount = req.membershipDiscount;
    billDetail.membershipDiscountPercent = req.membershipDiscountPercent;
    billDetail.membershipId = req.membershipId;
    billDetail.orderTotal = req.orderTotal;
    billDetail.taxId = req.taxId;
    billDetail.taxPercentage = req.taxPercentage;
    billDetail.couponCode = req.couponCode;
    billDetail.couponDiscount = req.couponDiscount;
    billDetail.totalOfferDiscount = req.totalOfferDiscount;
    // billDetail.message = req.message;
    billDetail.taxAmount = req.taxAmount;
    return res.status(200).send({
      success: true, 
      isSuccess: req.success,
      message: "cart fetched successfully",
      isMessage: req.message,
      data: req.Cart ? { cartData: req.Cart, billDetail: billDetail } : null,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

exports.quantityUpdate = async (req, res) => {
  try {
    let Cart = req.Cart;
    if (req.Cart.quantity > 4) {
      return res.status(400).json({
        success: false,
        message: "you can add maximum 5 quantity",
      });
    }
    let updateCart = await cartModel
      .findOneAndUpdate(
        { _id: req.Cart._id },
        {
          $set: {
            quantity: Cart.quantity + 1,
            price: Cart.productId.price * (Cart.quantity + 1),
          },
        },
        { new: true }
      )
      .populate("productId");
    return res.status(200).json({
      success: true,
      message: "Quantity Update Successfully...",
      data: updateCart,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

exports.removeQuantity = async (req, res) => {
  try {
    let Cart = req.Cart;
    if (Cart.quantity > 1) {
      let updateCart = await cartModel
        .findOneAndUpdate(
          { _id: req.Cart._id },
          {
            $set: {
              quantity: Cart.quantity - 1,
              price: Cart.productId.price * (Cart.quantity - 1),
            },
          },
          { new: true }
        )
        .populate("productId");
      return res.status(200).send({
        success: true,
        message: "Cart Updated Successfully",
        data: updateCart,
      });
    } else {
      if (Cart.image) {
        deleteFileFromObjectStorage(Cart.image);
      }
      await cartModel.findOneAndDelete({ _id: req.Cart._id });
      return res.status(200).json({
        success: true,
        message: "Cart Is Successfully Delete...",
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteCustomerCart = async (req, res) => {
  try {
    let Cart = await cartModel.find({ customerId: req.User._id });
    if (!Cart.length) {
      return res
        .status(400)
        .json({ success: false, message: "Cart Not Found" });
    }
    for (let i = 0; i < Cart.length; i++) {
      if (Cart[i].image != null) {
        deleteFileFromObjectStorage(Cart[i].image);
      }
    }
    let updateCart = await cartModel.deleteMany({
      customerId: req.params.customerId,
    });
    return res.status(200).json({
      success: true,
      message: "Cart Delete Successfully.....",
      data: updateCart,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

exports.deleteCartById = async (req, res) => {
  try {
    if (req.Cart.image != null) {
      deleteFileFromObjectStorage(req.Cart.image);
    }
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

exports.updateImage = async (req, resp) => {
  try {
    let image = req.file ? req.file.key : null;
    if (image && req.Cart.image != null) {
      deleteFileFromObjectStorage(req.Cart.image);
    }
    const updateImg = await cartModel.findByIdAndUpdate(
      { _id: req.Cart._id },
      {
        $set: { image: image != null ? image : req.Cart.image },
      }
    );
    return resp
      .status(200)
      .send({ success: true, message: "image update", updateImg: updateImg });
  } catch (error) {
    return resp.status(500).send({ success: false, message: error.message });
  }
};

// ======================= Create Cart ============================ ||

exports.createCartByAdmin = async (req, res) => {
  try {
    const data = req.body;
    const image = req.file ? req.file.key : null;
    if (!data.customerId) {
      return res
        .status(400)
        .json({ success: false, message: "customerId Is Required..." });
    }
    const productIds = data.productId;
    console.log(typeof productIds);
    if (typeof productIds == "string") {
      const products = await productModel.findOne({ _id: data.productId });
      const price1 = products.price * 1;
      let Cart = await cartModel.create({
        price: price1,
        customerId: data.customerId,
        productId: data.productId,
        // categoryId: data.categoryId,
        image: image,
      });
      return res.status(200).json({
        success: true,
        message: "Add To Cart Successfully",
        data: Cart,
      });
    } else {
      const cartEntries = [];

      for (const productId of productIds) {
        const existingCartEntry = await cartModel.findOne({
          customerId: data.customerId,
          productId: productId,
        });

        if (existingCartEntry) {
          // Product is already in the cart
          continue;
        }

        const product = await productModel.findOne({ _id: productId });
        if (!product) {
          continue;
        }

        const price = product.price * 1;

        const newCartEntry = {
          price: price,
          customerId: data.customerId,
          productId: productId,
          image: image,
        };

        cartEntries.push(newCartEntry);
      }

      if (cartEntries.length > 0) {
        const createdCartEntries = await cartModel.insertMany(cartEntries);
        return res.status(201).json({
          success: true,
          message: "Add To Cart Successfully...",
          data: createdCartEntries,
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Products are already in the cart or not found.",
        });
      }
    }
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
