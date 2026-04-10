const mongoose = require("mongoose");
const UserModel = require("../../models/userModel");
const ProductModel = require("../../models/ecommerce/productModel");

const ObjectId = mongoose.Types.ObjectId;

/*
   ADD PRODUCT TO WISHLIST
*/
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;

    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
    }

    const product = await ProductModel.findOne({
      _id: productId,
      disable: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or disabled",
      });
    }

    await UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { wishlist: productId } }, // prevents duplicates
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
   REMOVE PRODUCT FROM WISHLIST
*/
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
    }

    await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { wishlist: productId } }
    );

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
   TOGGLE WISHLIST (ADD / REMOVE)
*/
exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;

    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
    }

    const user = await UserModel.findById(userId).select("wishlist");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const exists = user.wishlist.some(
      (id) => id.toString() === productId
    );

    await UserModel.findByIdAndUpdate(userId, {
      [exists ? "$pull" : "$addToSet"]: { wishlist: productId },
    });

    return res.status(200).json({
      success: true,
      message: exists
        ? "Product removed from wishlist"
        : "Product added to wishlist",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
   GET USER WISHLIST
*/
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await UserModel.findById(userId).populate({
      path: "wishlist",
      match: { disable: false },
      select:
        "title  thumnail brandName variants reviewRating slug",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      count: user.wishlist.length,
      wishlist: user.wishlist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
   CHECK PRODUCT IS IN WISHLIST
*/
exports.isProductInWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
    }

    const user = await UserModel.findById(userId).select("wishlist");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isWishlisted = user.wishlist.some(
      (id) => id.toString() === productId
    );

    return res.status(200).json({
      success: true,
      isWishlisted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
