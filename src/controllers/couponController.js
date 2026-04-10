const couponModel = require("../models/couponModel");
const isUsedSchema = require("../models/isUsedCouponModel");
const {
  deleteFileFromObjectStorage,
} = require("../midellwares/multerMidellware");

/* ================= UTILS ================= */

function calculateEndDate(startDate, validity) {
  return new Date(
    new Date(startDate).getTime() + validity * 24 * 60 * 60 * 1000,
  );
}

/* ================= PARAM ID ================= */

exports.getCouponId = async (req, res, next, id) => {
  try {
    const coupon = await couponModel
      .findById(id)
      .populate("categoryId eComCategoryId");

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon Not Found",
      });
    }

    req.Coupon = coupon;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET ALL COUPONS ================= */

exports.getAllCoupon = async (req, res) => {
  try {
    const {
      type, // SERVICE | ECOMMERCE
      status, // ACTIVE | EXPIRED
      search,
      disable, // coupon name or code
      page = 1, // default page
      limit = 10, // default limit
    } = req.query;

    const pageNumber = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (pageNumber - 1) * pageLimit;

    let filter = {};

    /* ---------- SERVICE / ECOMMERCE ---------- */
    if (type) {
      filter.applyOn = { $in: [type] };
    }

   if (disable === "true" || disable === "false") {
  filter.disable = disable === "true";
}

    /* ---------- ACTIVE / EXPIRED ---------- */
    if (status === "ACTIVE") {
      filter.disable = false;
      filter.expiryDate = { $gte: new Date() };
      filter.couponQuantity = { $gt: 0 };
    }

    if (status === "EXPIRED") {
      filter.$or = [
        { expiryDate: { $lt: new Date() } },
        { couponQuantity: { $lte: 0 } },
      ];
    }

    /* ---------- SEARCH ---------- */
    if (search) {
      filter.$or = [
        { couponName: { $regex: search, $options: "i" } },
        { couponCode: { $regex: search, $options: "i" } },
      ];
    }

    /* ---------- QUERY ---------- */
    const [coupons, totalCoupons] = await Promise.all([
      couponModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit),

      couponModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        totalCoupons,
        totalPages: Math.ceil(totalCoupons / pageLimit),
        currentPage: pageNumber,
        limit: pageLimit,
      },
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET COUPON BY ID ================= */

exports.getCouponById = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.Coupon,
  });
};

/* ================= GET COUPON BY CATEGORY ================= */

exports.getCouponsByCategory = async (req, res) => {
  try {
    const { categoryId, eComCategoryId } = req.query;

    let filter = { disable: false };

    if (categoryId) filter.categoryId = categoryId;
    if (eComCategoryId) filter.eComCategoryId = eComCategoryId;

    const coupons = await couponModel.find(filter);

    return res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= CREATE COUPON ================= */

exports.creatCoupon = async (req, res) => {
  try {
    const {
      couponName,
      couponCode,
      discountType,
      discountValue,
      applyOn,
      categoryId,
      eComCategoryId,
      minOrderPrice,
      maxDiscountPrice,
      couponQuantity,
      backgroundColourCode,
      taskColourCode,
      validity,
      disable,
    } = req.body;

    if (!couponName || !couponCode) {
      return res.status(400).json({
        success: false,
        message: "Coupon name & code required",
      });
    }

    const startDate = new Date();
    const expiryDate = calculateEndDate(startDate, validity);
    const icon = req.file ? req.file.key : null;

    const coupon = await couponModel.create({
      couponName,
      couponCode,
      discountType,
      discountValue,
      applyOn,
      categoryId,
      eComCategoryId,
      minOrderPrice,
      maxDiscountPrice,
      couponQuantity,
      validity,
      startDate,
      expiryDate,
      icon,
      backgroundColourCode,
      taskColourCode,
      disable,
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= UPDATE COUPON ================= */

exports.updateCoupon = async (req, res) => {
  try {
    let icon = req.file ? req.file.key : req.Coupon.icon;

    if (req.file && req.Coupon.icon) {
      deleteFileFromObjectStorage(req.Coupon.icon);
    }

    let expiryDate = req.Coupon.expiryDate;
    if (req.body.validity) {
      expiryDate = calculateEndDate(req.Coupon.startDate, req.body.validity);
    }

    const updatedCoupon = await couponModel.findByIdAndUpdate(
      req.Coupon._id,
      { ...req.body, icon, expiryDate },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: updatedCoupon,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= ENABLE / DISABLE ================= */

exports.disableCoupon = async (req, res) => {
  try {
    const coupon = await couponModel.findByIdAndUpdate(
      req.Coupon._id,
      { disable: !req.Coupon.disable },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: coupon.disable
        ? "Coupon disabled successfully"
        : "Coupon enabled successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= APPLY COUPON ================= */

exports.applyCouponController = async (req, res) => {
  try {
    // If cart empty
    if (!req.Cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        billDetail: {
          netAmount: 0,
          taxAmount: 0,
          taxPercentage: null,
          deliveryPartnerFee: 0,
          platformFee: 0,
          couponCode: null,
          couponDiscount: 0,
          totalOfferDiscount: 0,
          orderTotal: 0,
        },
      });
    }

    // ✅ FINAL BILL STRUCTURE (exactly what you asked)
    const billDetail = {
      netAmount: req.netAmount, // Item Total
      taxAmount: req.taxAmount, // GST Amount
      taxPercentage: req.taxPercentage, // GST %

      deliveryPartnerFee: req.deliveryPartnerFee || 0,
      platformFee: req.platformFee || 0,

      couponCode: req.couponCode,
      couponId: req.couponId,
      couponDiscount: req.couponDiscount,
      totalOfferDiscount: req.totalOfferDiscount,

      orderTotal: req.orderTotal, // Final Payable
    };

    return res.status(200).json({
      success: true,
      message: req.message || "Bill calculated successfully",
      billDetail,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to apply coupon",
      error: error.message,
    });
  }
};

