const Refund = require("../models/refundModel");
const Order = require("../models/ecommerce/orderModel");
const Booking = require("../models/bookingModel");
const Bank = require("../models/bankModel");
const transactionModel = require("../models/ecommerce/transactionModel");
// const Transaction = require("../models/ecommerce/transactionModel");
const { sendRefundRequestNotification } = require("../controllers/notificationController");
const logger = require("../logger");
const commpanyModel = require("../models/commpanyModel");
const Product = require("../models/ecommerce/productModel");
const Category = require("../models/categoryModel");




exports.createRefundRequest = async (req, res) => {
  try {
    const {
      refundFor, // ECOMMERS | SERVICES
      orderId,
      bookingId,
      BankId,
    } = req.body;

    const userId = req.user._id;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ======================
    // 🔹 BASIC VALIDATION
    // ======================
    if (!refundFor) {
      return res.status(400).json({
        success: false,
        message: "refundFor are required",
      });
    }

    if (refundFor === "ECOMMERS" && !orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    if (refundFor === "SERVICES" && !bookingId) {
      return res.status(400).json({ message: "bookingId is required" });
    }

    // ======================
    // PREVENT DUPLICATE REFUND
    // ======================

    const alreadyExists = await Refund.findOne({
      userId,
      orderId: orderId,
      bookingId: bookingId,
      status: { $in: ["PENDING", "APPROVED", "COMPLETED"] },
    });

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Refund already requested for this item",
      });
    }

    let netAmount = 0;
    let refundAmount = 0;
    let paymentDetails = {};
    let company = await commpanyModel.findOne().select("adminCharge");

    //  ORDER REFUND
    if (refundFor === "ECOMMERS") {
      const order = await Order.findOne({
        _id: orderId,
        customerId: userId,
        status: "CANCELLED",
        paymentStatus: "REFUNDED",
        createdAt: { $gte: sevenDaysAgo },
      });

      if (!order) {
        return res.status(400).json({
          message: "Order not eligible for refund",
        });
      }

      netAmount = order.orderTotal;
      refundAmount = order.orderTotal - company.adminCharge;

      //  Payment details ONLY from DB
      const transactionId = order.transactionId;

      console.log("transactionId for refund:", transactionId);
      if (transactionId) {
        const transaction = await transactionModel.findById(transactionId);

        if (transaction) {
          paymentDetails = {
            paymentMethod: transaction.paymentMethod,
            transactionId: transaction._id,
            transactionRef: transaction.razorpayOrderId || null,
            razorpayPaymentId: transaction.razorpayPaymentId || null,
          };
        }
      }
    }

    //  SERVICE REFUND
    if (refundFor === "SERVICES") {
      const booking = await Booking.findOne({
        _id: bookingId,
        userId,
        bookingStatus: "CANCELLED",
        paymentStatus: "REFUNDED",
        updatedAt: { $gte: sevenDaysAgo },
      });

      if (!booking) {
        return res.status(400).json({
          message: "Booking not eligible for refund",
        });
      }

      netAmount = booking.finalPayableAmount;
      refundAmount = booking.finalPayableAmount - company.adminCharge;

      const transactionId = booking.transactionId;
      // console.log("transactionId for service refund:", transactionId);
      if (transactionId) {
        const transaction = await transactionModel.findById(transactionId);
        // console.log("transaction for service refund:", transaction);

        if (transaction) {
          paymentDetails = {
            paymentMethod: transaction.paymentMethod,
            transactionId: transaction._id,
            transactionRef: transaction.razorpayOrderId || null,
            razorpayPaymentId: transaction.razorpayPaymentId || null,
          };
        }
      }
    }

    // ======================
    // CREATE REFUND REQUEST
    // ======================
    // console.log("BankId for refund:", BankId);
    const bankDetails = await Bank.findOne({ _id: BankId, userId, isVerified: true })
      .select("+accountNumber accountHolderName bankName branchName ifscCode upiId upiHolderName paymentType");
    // console.log(bankDetails, "bank details for refund")
    if (!bankDetails) {
      return res.status(400).json({
        success: false,
        message: "Verified payment method not found",
      });
    }

    const refundPayload = {
      userId,
      refundFor,
      orderId: orderId || null,
      bookingId: bookingId || null,
      netAmount,
      refundAmount,
      paymentMethod: paymentDetails.paymentMethod,
      transactionId: paymentDetails.transactionId,
      transactionRef: paymentDetails.transactionRef,
      razorpayPaymentId: paymentDetails.razorpayPaymentId,

      status: "PENDING",
    };
    if (paymentDetails?.paymentMethod) {
      refundPayload.paymentMethod = paymentDetails.paymentMethod;
    }



    // 3️⃣ Attach snapshot based on payment type
    if (bankDetails.paymentType === "BANK") {
      refundPayload.paymentType = "BANK";

      refundPayload.bankDetails = Object.freeze({
        accountHolderName: bankDetails.accountHolderName,
        bankName: bankDetails.bankName,
        branchName: bankDetails.branchName,
        ifscCode: bankDetails.ifscCode,
        accountNumber: bankDetails.accountNumber,
      });
    }

    if (bankDetails.paymentType === "UPI") {
      refundPayload.paymentType = "UPI";

      refundPayload.upi = Object.freeze({
        upiId: bankDetails.upiId,
        upiHolderName: bankDetails.upiHolderName,
      });
    }

    const refund = await Refund.create(refundPayload);
    if (refundFor === "ECOMMERS" && orderId) {
      await Order.updateOne(
        { _id: orderId, customerId: userId },
        {
          $set: {
            paymentStatus: "REFUND_REQUESTED",
            refundRequestedAt: new Date(),
          },
        }
      );
    }

    if (refundFor === "SERVICES" && bookingId) {
      await Booking.updateOne(
        { _id: bookingId, userId },
        {
          $set: {
            paymentStatus: "REFUND_REQUESTED",
            refundRequestedAt: new Date(),
          },
        }
      );
    }


    if (orderId || bookingId) {
      const refId = orderId || bookingId;
      // console.log(userId, refundFor, refId, "refund notification details")
      sendRefundRequestNotification({
        userId: userId,
        refundFor: refundFor,
        refId: refId,
      });
    }

    logger.info(`Request received: ${req.method} ${req.path}`);

    return res.status(201).json({
      success: true,
      message: "Refund request submitted successfully",
      data: refund,
    });

  } catch (error) {
    console.error("Refund error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getCancelledPaidOrdersAndBookings = async (req, res) => {
  try {
    const userId = req.user._id;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const company = await commpanyModel.findOne().select("adminCharge");
    const adminCharge = company?.adminCharge || 0;

    // ======================
    // 🔹 ORDERS
    // ======================
    const orders = await Order.find({
      customerId: userId,
      status: "CANCELLED",
      paymentStatus: "REFUNDED",
      paymentMethod: "ONLINE",
      createdAt: { $gte: sevenDaysAgo },
    }).sort({ createdAt: -1 });

    const formattedOrders = [];

    for (const order of orders) {
      const firstProduct = order.product?.[0];

      let productData = null;
      if (firstProduct?.productId) {
        productData = await Product.findById(firstProduct.productId).select(
          "title thumnail"
        );
      }

      const refundAmount = Math.max(
        (order.orderTotal) - adminCharge,
        0
      );

      formattedOrders.push({
        _id: order._id,
        orderTotal: order.orderTotal,
        netAmount: order.netAmount,
        adminCharge,
        refundAmount,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        orderId: order._id,
        product: productData
          ? {
            productId: productData._id,
            title: productData.title,
            thumnail: productData.thumnail,
          }
          : null,
      });
    }

    // ======================
    // 🔹 BOOKINGS
    // ======================
    const bookings = await Booking.find({
      userId,
      bookingStatus: "CANCELLED",
      paymentStatus: "REFUNDED",
      paymentMethod: "RAZORPAY",
      updatedAt: { $gte: sevenDaysAgo },
    }).sort({ createdAt: -1 });

    const formattedBookings = [];

    for (const booking of bookings) {
      const service = await Category.findById(
        booking.subCategoryId
      ).select("name banner");

      formattedBookings.push({
        _id: booking._id,
        finalPayableAmount: booking.finalPayableAmount,
        bookingStatus: booking.bookingStatus,
        adminCharge,
        refundAmount: Math.max(booking.finalPayableAmount - adminCharge, 0),
        serviceDate: booking.serviceDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        service: service
          ? {
            serviceId: service._id,
            name: service.name,
            thumnail: service.banner,
          }
          : null,
      });
    }

    return res.json({
      success: true,
      data: {
        orders: formattedOrders,
        bookings: formattedBookings,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



exports.getMyRefundRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      refundFor,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // 🔐 Base filter: ONLY logged-in user's refunds
    const matchQuery = { userId };

    if (status) {
      matchQuery.status = status;
    }

    if (refundFor) {
      matchQuery.refundFor = refundFor;
    }

    if (search) {
      matchQuery.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { bookingId: { $regex: search, $options: "i" } },
        { paymentMethod: { $regex: search, $options: "i" } },
        { transactionId: { $regex: search, $options: "i" } },
      ];
    }

    const pipeline = [
      { $match: matchQuery },

      //  Join Order
      {
        $lookup: {
          from: "e-commordermodels", //  mongo plural name
          localField: "orderId",
          foreignField: "_id",
          as: "order",
        },
      },

      { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } },

      //  Get first productId from order.product array
      {
        $addFields: {
          firstProductId: {
            $arrayElemAt: ["$order.product.productId", 0],
          },
        },
      },

      //  Join Product to get title
      {
        $lookup: {
          from: "ecommerceproductmodels", //  product collection
          localField: "firstProductId",
          foreignField: "_id",
          as: "product",
        },
      },

      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "bookingmodels",
          localField: "bookingId",
          foreignField: "_id",
          as: "booking",
        }
      },
      {
        $unwind: { path: "$booking", preserveNullAndEmptyArrays: true }

      },

      {
        $lookup: {
          from: "categorymodels",
          localField: "booking.subCategoryId",
          foreignField: "_id",
          as: "serviceCategory",
        },
      },
      {
        $unwind: { path: "$serviceCategory", preserveNullAndEmptyArrays: true }
      },

      {
        $project: {
          refundFor: 1,
          orderId: 1,
          bookingId: 1,
          netAmount: 1,
          refundAmount: 1,
          status: 1,
          paymentMethod: 1,
          transactionId: 1,
          createdAt: 1,
          updatedAt: 1,
          refundTransactionId: 1,
          productTitle: {
            $cond: {
              if: { $eq: ["$refundFor", "ECOMMERS"] },
              then: "$product.title",
              else: "$serviceCategory.name"
            }
          },

          bankDetails: 1,
          upi: 1,
        },
      },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
    ];


    const refunds = await Refund.aggregate(pipeline);
    const total = await Refund.countDocuments(matchQuery);

    return res.status(200).json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
      data: refunds,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getAllRefundRequests = async (req, res) => {
  try {

    const { page = 1, limit = 10, search = "", status, refundFor, timeSlot,
      fromDate,
      toDate, } = req.query;
    const skip = (page - 1) * limit;

    const matchQuery = {};

    if (status) matchQuery.status = status;
    if (refundFor) matchQuery.refundFor = refundFor;

    if (fromDate && toDate) {
      matchQuery.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)),
      }
    }


    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "usermodels",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      ...(search ? [
        {
          $match: {
            "user.name": { $regex: search, $options: "i" },
          }
        },
      ] : []),
      {
        $project: {
          refundFor: 1,
          orderId: 1,
          bookingId: 1,
          netAmount: 1,
          orderTotal: 1,
          status: 1,
          paymentMethod: 1,
          transactionId: 1,
          createdAt: 1,
          user: {
            _id: "$user._id",
            fullName: "$user.fullName",
            email: "$user.email",
            phoneNumber: "$user.phoneNumber",
          },
          bankDetails: 1,
          upi: 1,
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },

    ];
    const refund = await Refund.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total: refund.length,
      totalPages: Math.ceil(refund.length / limit),
      data: refund,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}




exports.updateRefundStatusByAdmin = async (req, res) => {
  try {
    const { refundId } = req.params;

    const {
      status,                   // APPROVED | REJECTED | COMPLETED
      adminRemark,
      refundTransactionId,
    } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Refund status is required",
      });
    }

    const refund = await Refund.findById(refundId);

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund request not found",
      });
    }

    //  Block invalid updates
    if (["COMPLETED", "REJECTED"].includes(refund.status)) {
      return res.status(400).json({
        success: false,
        message: `Refund already ${refund.status}`,
      });
    }

    //  Status Flow Validation
    if (status === "COMPLETED") {
      if (refund.status !== "APPROVED") {
        return res.status(400).json({
          success: false,
          message: "Refund must be APPROVED before COMPLETED",
        });
      }

      if (!refundTransactionId) {
        return res.status(400).json({
          success: false,
          message: "refundTransactionId is required to complete refund",
        });
      }

      refund.refundTransactionId = refundTransactionId;
    }

    if (status === "REJECTED" && !adminRemark) {
      return res.status(400).json({
        success: false,
        message: "Admin remark is required for rejection",
      });
    }

    //  Update fields
    refund.status = status;
    refund.processedAt = new Date();

    if (adminRemark) {
      refund.adminRemark = adminRemark;
    }

    await refund.save();

    return res.status(200).json({
      success: true,
      message: "Refund status updated successfully",
      data: {
        refundId: refund._id,
        status: refund.status,
        refundTransactionId: refund.refundTransactionId,
        processedAt: refund.processedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
