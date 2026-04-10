const reviewModel = require("../models/reviewModel");
const bookingModel = require("../models/bookingModel");
const categoryModel = require("../models/categoryModel");
const { updateParentCategoryRating } = require("../helper/updatePrating");

// ================= CREATE REVIEW =================

exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: "bookingId and rating required",
      });
    }

    const booking = await bookingModel.findOne({
      _id: bookingId,
      userId: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.bookingStatus !== "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Review allowed only after completion",
      });
    }

    const existing = await reviewModel.findOne({ bookingId });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Review already submitted",
      });
    }

    const subCategoryId = booking.subCategoryId;

    // create review
    let review = await reviewModel.create({
      bookingId,
      subCategoryId,
      userId: req.user._id,
      rating,
      comment,
    });

    //  recalc avg rating
    const stats = await reviewModel.aggregate([
      { $match: { subCategoryId, disable: false } },
      {
        $group: {
          _id: "$subCategoryId",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const avgRating = stats.length ? stats[0].avgRating : 0;
    const totalReviews = stats.length ? stats[0].totalReviews : 0;

    await categoryModel.findByIdAndUpdate(subCategoryId, {
      avgRating: avgRating.toFixed(1),
      totalRating: totalReviews,
    });

    await updateParentCategoryRating(subCategoryId);

    //  populate before sending response
    review = await reviewModel
      .findById(review._id)
      .populate("userId", "fullName image email")
      .populate("subCategoryId", "name");

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET SUMMARY =================

exports.getSubCategoryRatingSummary = async (req, res) => {
  try {
    const { subCategoryId } = req.params;

    const category = await categoryModel.findById(subCategoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    const reviews = await reviewModel
      .find({
        subCategoryId,
        disable: false,
      })
      .populate("userId", "fullName image email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      category: {
        name: category.name,
        avgRating: category.avgRating,
        totalReviews: category.totalRating,
      },
      reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= ADMIN DISABLE =================

exports.disableReview = async (req, res) => {
  const review = await reviewModel.findByIdAndUpdate(
    req.params.reviewId,
    { disable: true },
    { new: true },
  );

  return res.status(200).json({
    success: true,
    message: "Review disabled",
    data: review,
  });
};
