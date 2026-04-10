const reviewModel = require("../../models/ecommerce/reviewModel");
const productModel = require("../../models/ecommerce/productModel");

// ==================== Get Id ==================== ||

exports.getReviewId = async (req, res, next, id) => {
  let review = await reviewModel.findById(id);
  if (!review) {
    return res.status(404).json({
      success: false,
      message: "Review Not Found",
    });
  } else {
    (req.Review = review), next();
  }
};

// ==================  create Review ===================== ||

const mongoose = require("mongoose");

exports.createReview = async (req, res) => {
  try {
    const { userId, orderId, productId, comment, rating, disable } = req.body;

    if (!userId || !orderId || !productId || !comment || !rating) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const exists = await reviewModel.exists({
      orderId,
      productId,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Review already exists for this order and product",    //
      });
    }

    const review = await reviewModel.create({
      userId,
      orderId,
      productId,
      comment,
      rating,
      disable,
    });

    const result = await reviewModel.aggregate([
      {
        $match: {
          productId: new mongoose.Types.ObjectId(productId),
        },
      },
      {
        $group: {
          _id: "$productId",
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    const avgRating = result.length
      ? Number(result[0].avgRating.toFixed(1))
      : 0;

    await productModel.findByIdAndUpdate(productId, {
      reviewRating: avgRating,
    });

    return res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: review,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// ================== Get Review By Id ======================= ||

exports.getReviewById = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Review Is Fatch Successfully..",
    data: req.Review,
  });
};

// =================== Get All Review ================== ||

exports.getAllReviewByProductId = async (req, res) => {
  let page = req.query.page;
  const startIndex = page ? (page - 1) * 20 : 0;
  const endIndex = startIndex + 20;
  let review = await reviewModel
    .find({ productId: req.params.productId })
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(endIndex)
    .populate("userId");
  let length = await reviewModel.countDocuments({
    productId: req.params.productId,
  });
  let count = Math.ceil(length / 20);
  return res.status(200).json({
    success: true,
    message: "Review Is Fatch Successfully...",
    data: review,
    page: count,
  });
};

// ======================== update Review ======================== ||

exports.updateReview = async (req, res) => {
  let { userId, productId, comment, rating, disable } = req.body;
  let review = await reviewModel.findByIdAndUpdate(
    { _id: req.Review._id },
    {
      $set: {
        userId: userId,
        productId: productId,
        comment: comment,
        rating: rating,
        disable: disable,
      },
    },
    { new: true }
  );

  let total = 0;
  let reviews = await reviewModel.find({ productId: review.productId });
  for (let i = 0; i < reviews.length; i++) {
    total += reviews[i].rating;
  }
  let ratings = reviews.length ? total / reviews.length : 0 ;
  await productModel.findByIdAndUpdate(
    { _id: review.productId },
    { $set: { reviewRating: ratings.toFixed(1) } },
    { new: true }
  );
  return res.status(200).json({
    success: true,
    message: "Review Is Update Successfully...",
    data: review,
  });
};

// ======================== delete Review ====================== ||

exports.deleteReview = async (req, res) => {
  let review = await reviewModel.deleteOne({ _id: req.Review._id });
  return res.status(200).json({
    success: true,
    message: "Review Is Delete Successfully...",
    data: review,
  });
};

// ========================== disable Review ===================== ||

exports.disableReview = async (req, res) => {
  let review = await reviewModel.findByIdAndUpdate(
    { _id: req.Review._id },
    { $set: { disable: !req.Review.disable } },
    { new: true }
  );
  if (review.disable == true) {
    return res.status(200).json({
      success: true,
      message: "Review Is disable Successfully...",
    });
  }
  return res.status(200).json({
    success: true,
    message: "Review Is Enable Successfully...",
  });
};
