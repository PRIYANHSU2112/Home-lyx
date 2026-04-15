const bookingModel = require("../models/bookingModel");
const categoryModel = require("../models/categoryModel");
const couponModel = require("../models/couponModel");
const taxModel = require("../models/taxModel");
const isUsedSchema = require("../models/isUsedCouponModel");
const walletModel = require("../models/walletModel");
const transactionModel = require("../models/ecommerce/transactionModel");
const partnerTransactionModel = require("../models/partnerTransaction");
const settlementService = require("../services/settlementService");
const userModel = require("../models/userModel"); 
const cityModel = require("../models/cityModel");

const mongoose = require("mongoose");

const { calculatePlatformFee } = require("../helper/platformFee");

const {
  sendNotificationToUserOnServiceBooking,
  sendVendorAcceptNotification,
  sendVendorRejectNotification,
  sendVendorCompleteNotification
} = require("./notificationController");
const partnerProfileModel = require("../models/partnerProfileModel");

exports.createBooking = async (req, res) => {
  try {
    const {
      subCategoryId,
      numberOfFloors,
      couponCode,
      serviceDate,
      serviceTimeSlot,
      serviceLocation,
    } = req.body;

    /* ---------- VALIDATE LOCATION ---------- */
    if (
      !serviceLocation ||
      !serviceLocation.address ||
      serviceLocation.latitude === undefined ||
      serviceLocation.longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Address, latitude and longitude are required",
      });
    }

    /* ---------- VALIDATE SUB CATEGORY ---------- */
    const subCategory = await categoryModel.findById(subCategoryId);

    if (!subCategory || !subCategory.pCategory) {
      return res.status(400).json({
        success: false,
        message: "Only sub-categories can be booked",
      });
    }

    if (!subCategory.price || subCategory.price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Service price not configured",
      });
    }

    if (!subCategory.partnerId) {
      return res.status(400).json({
        success: false,
        message: "This service is not assigned to any partner",
      });
    }

    /* ---------- GEO-BASED CITY VALIDATION ---------- */
    const { latitude, longitude } = serviceLocation;

    console.log(latitude, longitude);

    const nearestCity = await cityModel.findOne({
      disable: false,
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: 50000, // 50 km in meters
        },
      },
    });
    console.log(nearestCity);

    if (!nearestCity) {
      return res.status(400).json({
        success: false,
        message: "No serviceable city found within 50 km of your location",
      });
    }

    // Check if the subCategory is available in the nearest city
    if (
      !subCategory.cityId ||
      subCategory.cityId.length === 0 ||
      !subCategory.cityId.some(
        (cId) => cId.toString() === nearestCity._id.toString()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: `This service is not available in ${nearestCity.cityName}`,
        nearestCity: nearestCity.cityName,
      });
    }

    /* ---------- BASE PRICE ---------- */
    const pricePerFloor = subCategory.price;
    const totalAmount = pricePerFloor * numberOfFloors;

    let discountAmount = 0;
    let finalPayableAmount = totalAmount;
    let appliedCouponCode = null;
    let appliedCouponId = null;

    /* ================= APPLY COUPON ================= */
    if (couponCode) {
      const coupon = await couponModel.findOne({
        couponCode,
        disable: false,
        expiryDate: { $gte: new Date() },
        applyOn: { $in: ["SERVICE"] },
      });

      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired coupon",
        });
      }

      if (coupon.couponQuantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Coupon usage limit reached",
        });
      }

      if (totalAmount < coupon.minOrderPrice) {
        return res.status(400).json({
          success: false,
          message: `Minimum order amount is ₹${coupon.minOrderPrice}`,
        });
      }

      const alreadyUsed = await isUsedSchema.findOne({
        couponId: coupon._id,
        userId: req.user._id,
      });

      if (alreadyUsed) {
        return res.status(400).json({
          success: false,
          message: "You have already used this coupon",
        });
      }

      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = (totalAmount * coupon.discountValue) / 100;

        if (coupon.maxDiscountPrice) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscountPrice);
        }
      } else {
        discountAmount = coupon.discountValue;
      }

      finalPayableAmount -= discountAmount;

      appliedCouponCode = coupon.couponCode;
      appliedCouponId = coupon._id;

      await isUsedSchema.create({
        couponId: coupon._id,
        userId: req.user._id,
        couponCode: coupon.couponCode,
      });

      coupon.couponQuantity -= 1;
      if (coupon.couponQuantity === 0) coupon.disable = true;

      await coupon.save();
    }

    /* ---------- APPLY PLATFORM FEE ---------- */
    let platformFee = await calculatePlatformFee(finalPayableAmount);
    finalPayableAmount += platformFee;

    console.log(platformFee);
    /* ---------- APPLY TAX ---------- */
    let taxId = null;
    let taxPercent = 0;
    let taxAmount = 0;

    const tax = await taxModel.findOne().sort({ createdAt: -1 });
    console.log(tax);

    if (tax) {
      taxId = tax._id;
      console.log(`tax id: ${taxId}`);
      taxPercent = tax.taxPercent;
      taxAmount = Math.round((finalPayableAmount * taxPercent) / 100);
      finalPayableAmount = Math.round(finalPayableAmount + taxAmount);
    }

    const parentCategory = subCategory.pCategory
      ? await categoryModel.findById(subCategory.pCategory)
      : null;
    console.log("parentCategory",parentCategory)
    const adminChargePercent = Number(
      parentCategory?.adminCharge ?? subCategory.adminCharge ?? 0,
    );
    console.log("adminChargesPercent", adminChargePercent)
    const adminChargeAmount = Math.round(
      (finalPayableAmount * adminChargePercent) / 100,
    );
    console.log("adminChargeAmount",adminChargeAmount)
    const partnerId = subCategory.partnerId || null;
    console.log(partnerId)

    /* ---------- SERVICE DATE TIME ---------- */
    function buildServiceDateTime(serviceDate, serviceTimeSlot) {
      const startTime = serviceTimeSlot.split("-")[0].trim();
      const [time, modifier] = startTime.split(" ");
      let [hours, minutes] = time.split(":").map(Number);

      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      const dateTime = new Date(serviceDate);
      dateTime.setHours(hours, minutes, 0, 0);
      return dateTime;
    }

    const serviceDateTime = buildServiceDateTime(serviceDate, serviceTimeSlot);

    /* ---------- CREATE BOOKING ---------- */
    const booking = await bookingModel.create({
      userId: req.user._id,
      subCategoryId,
      numberOfFloors,
      pricePerFloor,
      totalAmount,
      couponCode: appliedCouponCode,
      couponId: appliedCouponId,
      discountAmount,
      platformFee, //  NEW FIELD
      taxId,
      taxPercent,
      taxAmount,
      finalPayableAmount,
      partnerId,
      adminCharge: adminChargePercent,
      adminChargeAmount,
      serviceDate,
      serviceTimeSlot,
      serviceLocation,
      serviceDateTime,
    });

    return res.status(201).json({
      success: true,
      message: "Service booked successfully",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get Booking BY id
exports.getBookingById = async (req, res) => {
  try {
    const { bookingId, adminId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    let booking;

    if (adminId) {
      booking = await bookingModel
        .findById(bookingId)
        .populate("userId subCategoryId");
    } else {
      booking = await bookingModel
        .findOne({
          _id: bookingId,
          userId: req.user._id,
        })
        .populate("subCategoryId");
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or access denied",
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get All Bookings



exports.getAllBookingsByAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sort,
      paymentMethod,
    } = req.query;

    const skip = (page - 1) * limit;

    let filter = {};

    // Status filter
    if (status) {
      filter.bookingStatus = status;
    }

    // Payment Method filter
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    // Sorting
    let sortOption = { createdAt: -1 };

    if (sort === "low") {
      sortOption = { finalPayableAmount: 1 };
    } else if (sort === "high") {
      sortOption = { finalPayableAmount: -1 };
    }

    // 🔥 SEARCH OPTIMIZED (NO CRASH + COMBINED SEARCH)
    if (search) {
      const searchConditions = [];

      //  1. Search by Booking ID (only if valid ObjectId)
      if (mongoose.Types.ObjectId.isValid(search)) {
        searchConditions.push({ _id: new mongoose.Types.ObjectId(search) });
      }

      //  2. Search by User Name
      const users = await userModel
        .find({
          fullName: { $regex: search, $options: "i" },
        })
        .select("_id")
        .lean();

      if (users.length > 0) {
        const userIds = users.map((u) => u._id);
        searchConditions.push({ userId: { $in: userIds } });
      }

      //  Apply OR condition
      if (searchConditions.length > 0) {
        filter.$or = searchConditions;
      } else {
        // If nothing matched → return empty
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            totalRecords: 0,
            totalPages: 0,
            currentPage: Number(page),
          },
        });
      }
    }

    // 🚀 PARALLEL EXECUTION
    const [bookings, total] = await Promise.all([
      bookingModel
        .find(filter)
        .populate("userId", "fullName email phoneNumber")
        .populate("subCategoryId")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      bookingModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        totalRecords: total,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//get All booking of User

exports.getUserBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const skip = (page - 1) * limit;

    let filter = { userId: req.user._id };

    if (status) {
      filter.bookingStatus = status;
    }

    const [bookings, total] = await Promise.all([
      bookingModel
        .find(filter)
        .populate("subCategoryId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      bookingModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        totalRecords: total,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
      },
      data: bookings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all bookings for a partner
exports.getPartnerBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const partnerId = req.params.partnerId;

    let filter = { partnerId };

    if (status) {
      if (status === "PENDING") {
        filter.partnerBookingStatus = "PENDING";
      } else if (status === "ACCEPTED") {
        filter.partnerBookingStatus = "ACCEPTED";
      } else if (status === "REJECTED") {
        filter.partnerBookingStatus = "REJECTED";
      } else if (status === "COMPLETED") {
        filter.partnerBookingStatus = "COMPLETED";
      } else if (status === "CANCELLED") {
        filter.bookingStatus = "CANCELLED";
      }
    }

    const bookings = await bookingModel
      .find(filter)
      .populate("userId", "name phoneNumber email")
      .populate("subCategoryId", "name price")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await bookingModel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Partner bookings retrieved successfully",
      data: bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBookings: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get booking detail for partner
exports.getPartnerBookingDetail = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const partnerId = req.params.partnerId;

    const booking = await bookingModel
      .findOne({ _id: bookingId, partnerId })
      .populate("userId", "name phoneNumber email")
      .populate("subCategoryId", "name price description")

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or not authorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking detail retrieved successfully",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.partnerRespondBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { action, reason } = req.body;

    if (!["ACCEPT", "REJECT", "COMPLETE"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be ACCEPT, REJECT or COMPLETE",
      });
    }

    const booking = await bookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }
    const partner = await partnerProfileModel.findOne({ userId: req.user._id });

    if (!booking.partnerId || booking.partnerId.toString() !== partner._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this partner booking",
      });
    }

    if (booking.bookingStatus === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    if (action === "ACCEPT") {
      if (booking.partnerBookingStatus === "ACCEPTED") {
        return res.status(400).json({
          success: false,
          message: "Booking already accepted",
        });
      }

      booking.partnerBookingStatus = "ACCEPTED";
      booking.bookingStatus = "UPCOMING";
      booking.partnerAcceptedAt = new Date();
      await booking.save();

      sendVendorAcceptNotification({
        userId: booking.userId,
        orderId: booking._id,
        isService: true,
      });

      return res.status(200).json({
        success: true,
        message: "Booking accepted by partner",
        data: booking,
      });
    }

    if (action === "COMPLETE") {
      if (booking.partnerBookingStatus !== "ACCEPTED") {
        return res.status(400).json({
          success: false,
          message: "Booking must be accepted before it can be completed",
        });
      }

      if (booking.bookingStatus === "COMPLETED") {
        return res.status(400).json({
          success: false,
          message: "Booking already completed",
        });
      }

      if (booking.paymentStatus !== "PAID" && booking.paymentMethod !== "COD") {
        return res.status(400).json({
          success: false,
          message: "Booking payment must be PAID before completion",
        });
      }

      if(booking.paymentMethod === "COD"){
        booking.paymentStatus = "PAID"; 
        await booking.save();
      }

      const settlementResult = await settlementService.settleBookingCommission(
        booking._id,
      );

      if (!settlementResult.success) {
        return res.status(500).json({
          success: false,
          message: settlementResult.error || "Failed to settle booking commission",
        });
      }

      booking.bookingStatus = "COMPLETED";
      booking.partnerBookingStatus = "COMPLETED";
      await booking.save();

      sendVendorCompleteNotification({
        userId: booking.userId,
        orderId: booking._id,
        isService: true,
      });

      return res.status(200).json({
        success: true,
        message: "Booking marked as completed and commission settled",
        data: booking,
        settlement: settlementResult,
      });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let refundAmount = 0;
      let walletBalance = null;
      let refundTransaction = null;

      if (
        booking.paymentStatus === "PAID" &&
        ["RAZORPAY", "WALLET", "COD"].includes(booking.paymentMethod)
      ) {
        refundAmount = Number(booking.finalPayableAmount);

        if (refundAmount > 0) {
          let wallet = await walletModel.findOne(
            { customerId: booking.userId },
            null,
            { session },
          );

          if (!wallet) {
            const createdWallet = await walletModel.create(
              [
                {
                  customerId: booking.userId,
                  balance: refundAmount,
                },
              ],
              { session },
            );
            wallet = createdWallet[0];
          } else {
            wallet.balance += refundAmount;
            await wallet.save({ session });
          }

          walletBalance = wallet.balance;

          const [txn] = await transactionModel.create(
            [
              {
                bookingId: booking._id,
                customerId: booking.userId,
                amount: refundAmount,
                currency: "INR",
                paymentMethod: "WALLET",
                status: "SUCCESS",
                walletType: "CREDIT",
                walletPurpose: "REFUND",
              },
            ],
            { session },
          );

          refundTransaction = txn;
          booking.paymentStatus = "REFUNDED";
        }
      }

      const pendingCommissionTxn = await partnerTransactionModel.findOne({
        bookingId: booking._id,
        orderType: "SERVICE",
        transactionType: "COMMISSION_EARNED",
        status: "PENDING",
      });

      if (pendingCommissionTxn) {
        pendingCommissionTxn.status = "CANCELLED";
        pendingCommissionTxn.description = `Partner rejected booking ${booking._id}`;
        await pendingCommissionTxn.save({ session });
      }

      if (booking.commissionSettled) {
        await settlementService.reverseBookingCommission(
          booking._id,
          `Partner rejected booking: ${reason}`,
        );
      }

      booking.partnerBookingStatus = "REJECTED";
      booking.partnerRejectReason = reason;
      booking.bookingStatus = "CANCELLED";
      booking.cancelledBy = "PARTNER";
      booking.cancelReason = reason;
      booking.cancelledAt = new Date();
      await booking.save({ session });

      sendVendorRejectNotification({
        userId: booking.userId,
        orderId: booking._id,
        isService: true,
      });

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: "Booking rejected by partner",
        refundAmount,
        walletBalance,
        data: booking,
        transaction: refundTransaction,
      });
    } catch (nestedError) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({
        success: false,
        message: nestedError.message,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel Booking By User

exports.cancelBookingByUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId } = req.params;

    let walletBalance = null;
    let refundAmount = 0;

    const booking = await bookingModel.findOne(
      { _id: bookingId, userId: req.user._id },
      null,
      { session },
    );

    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.bookingStatus === "CANCELLED") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Booking already cancelled",
      });
    }

    /* ================= REFUND LOGIC ================= */
    if (
      booking.paymentStatus === "PAID" &&
      ["RAZORPAY", "WALLET", "COD"].includes(booking.paymentMethod)
    ) {
      refundAmount = Number(booking.finalPayableAmount); // -
      // Number(booking.platformFee || 0);

      if (refundAmount > 0) {
        let wallet = await walletModel.findOne(
          { customerId: req.user._id },
          null,
          { session },
        );

        // Create wallet if not exists
        if (!wallet) {
          const createdWallet = await walletModel.create(
            [
              {
                customerId: req.user._id,
                balance: refundAmount,
              },
            ],
            { session },
          );
          wallet = createdWallet[0];
        } else {
          wallet.balance += refundAmount;
          await wallet.save({ session });
        }

        walletBalance = wallet.balance;

        // Wallet refund transaction
        await transactionModel.create(
          [
            {
              bookingId: booking._id,
              customerId: req.user._id,
              amount: refundAmount,
              currency: "INR",
              paymentMethod: "WALLET",
              status: "SUCCESS",
              walletType: "CREDIT",
              walletPurpose: "REFUND",
            },
          ],
          { session },
        );

        booking.paymentStatus = "REFUNDED";
      }
    }

    /* ================= CANCEL BOOKING ================= */
    if (booking.commissionSettled) {
      await settlementService.reverseBookingCommission(
        booking._id,
        "Booking cancelled by user",
      );
    }

    await partnerTransactionModel.findOneAndUpdate(
      {
        bookingId: booking._id,
        orderType: "SERVICE",
        transactionType: "COMMISSION_EARNED",
        status: "PENDING",
      },
      {
        status: "CANCELLED",
        description: `Booking cancelled by user ${booking._id}`,
      },
      { session },
    );

    booking.partnerBookingStatus = "REJECTED";
    booking.bookingStatus = "CANCELLED";
    await booking.save({ session });

    /* ================= FALLBACK WALLET BALANCE ================= */
    if (walletBalance === null) {
      const wallet = await walletModel.findOne(
        { customerId: req.user._id },
        null,
        { session },
      );
      walletBalance = wallet ? wallet.balance : 0;
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message:
        refundAmount > 0
          ? "Booking cancelled and refund credited to wallet"
          : "Booking cancelled successfully",
      refundAmount,
      walletBalance,
      data: booking,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// change the booking status by Admin

exports.updateBookingStatusByAdmin = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { bookingStatus } = req.body;

    const allowedStatus = ["UPCOMING", "COMPLETED", "CANCELLED"];

    if (!allowedStatus.includes(bookingStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status",
      });
    }

    const booking = await bookingModel.findByIdAndUpdate(
      bookingId,
      { bookingStatus },
      { new: true },
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // console.log(booking)
    await sendNotificationToUserOnServiceBooking(
      booking,
      booking.bookingStatus,
    );
    return res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel Booking By Admin
exports.cancelBookingByAdmin = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  let refundTransaction = null;

  try {
    const { bookingId } = req.params;
    const { cancelReason } = req.body;

    if (!cancelReason || cancelReason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required",
      });
    }

    let refundAmount = 0;
    let walletBalance = null;

    const booking = await bookingModel.findById(bookingId, null, { session });

    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.bookingStatus === "CANCELLED") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Booking already cancelled",
      });
    }

    /* ================= REFUND LOGIC ================= */
    if (
      booking.paymentStatus === "PAID" &&
      ["RAZORPAY", "WALLET", "COD"].includes(booking.paymentMethod)
    ) {
      refundAmount = Number(booking.finalPayableAmount);

      if (refundAmount > 0) {
        let wallet = await walletModel.findOne(
          { customerId: booking.userId },
          null,
          { session },
        );

        if (!wallet) {
          const createdWallet = await walletModel.create(
            [
              {
                customerId: booking.userId,
                balance: refundAmount,
              },
            ],
            { session },
          );
          wallet = createdWallet[0];
        } else {
          wallet.balance += refundAmount;
          await wallet.save({ session });
        }

        walletBalance = wallet.balance;

        const [txn] = await transactionModel.create(
          [
            {
              bookingId: booking._id,
              customerId: booking.userId,
              amount: refundAmount,
              currency: "INR",
              paymentMethod: "WALLET",
              status: "SUCCESS",
              walletType: "CREDIT",
              walletPurpose: "REFUND",
            },
          ],
          { session },
        );

        refundTransaction = txn; //  store safely
        booking.paymentStatus = "REFUNDED";
      }
    }

    /* ================= CANCEL BOOKING ================= */
    if (booking.commissionSettled) {
      await settlementService.reverseBookingCommission(
        booking._id,
        `Booking cancelled by admin: ${cancelReason}`,
      );
    }

    await partnerTransactionModel.findOneAndUpdate(
      {
        bookingId: booking._id,
        orderType: "SERVICE",
        transactionType: "COMMISSION_EARNED",
        status: "PENDING",
      },
      {
        status: "CANCELLED",
        description: `Booking cancelled by admin ${booking._id}`,
      },
      { session },
    );

    booking.partnerBookingStatus = "REJECTED";
    booking.bookingStatus = "CANCELLED";
    booking.cancelledBy = "ADMIN";
    booking.cancelReason = cancelReason;
    booking.cancelledAt = new Date();

    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Booking cancelled by admin successfully",
      refundAmount,
      walletBalance,
      data: booking,
      transaction: refundTransaction, //  null if no refund
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
