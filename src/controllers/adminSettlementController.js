const settlementService = require("../services/settlementService");
const partnerWalletModel = require("../models/partnerWallet");
const partnerTransactionModel = require("../models/partnerTransaction");
const withdrawalRequestModel = require("../models/withdrawalRequest");
const partnerProfileModel = require("../models/partnerProfileModel");
const userModel = require("../models/userModel");
const orderModel = require("../models/ecommerce/orderModel");
const mongoose = require("mongoose");

/**
 * List all partners with wallet summary
 */
exports.listPartners = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { vendorType: { $regex: search, $options: "i" } },
        { $expr: { $regexMatch: { input: { $toString: "$phoneNumber" }, regex: search, options: "i" } } }
      ];
    }

    if (status) {
      if (status === "active") query.disable = false;
      if (status === "inactive") query.disable = true;
    }

    const total = await partnerProfileModel.countDocuments(query);
    const partners = await partnerProfileModel
      .find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .select("_id name email phoneNumber address cityId disable")
      .lean();

    // Get wallet info for each partner
    const partnerIds = partners.map((p) => p._id);
    const wallets = await partnerWalletModel.find({ partnerId: { $in: partnerIds } }).lean();
    const walletMap = {};
    wallets.forEach((w) => {
      walletMap[w.partnerId.toString()] = w;
    });

    const enrichedPartners = partners.map((p) => ({
      ...p,
      wallet: walletMap[p._id.toString()] || {
        totalEarning: 0,
        totalWithdrawn: 0,
        balance: 0,
        pendingBalance: 0,
      },
    }));

    return res.status(200).json({
      success: true,
      data: enrichedPartners,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error in listPartners:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get detailed wallet for a specific partner
 */
exports.getPartnerWallet = async (req, res) => {
  try {
    const { partnerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid partner ID",
      });
    }

    const partner = await partnerProfileModel
      .findById(partnerId)
      .select("name email phoneNumber address")
      .lean();

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    const wallet = await partnerWalletModel.findOne({ partnerId }).lean();

    if (!wallet) {
      return res.status(200).json({
        success: true,
        data: {
          partner,
          wallet: {
            totalEarning: 0,
            totalWithdrawn: 0,
            balance: 0,
            pendingBalance: 0,
            lastSettlementDate: null,
          },
          recentTransactions: [],
        },
      });
    }

    // Get last 50 transactions
    const transactions = await partnerTransactionModel
      .find({ partnerId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        partner,
        wallet,
        recentTransactions: transactions,
      },
    });
  } catch (error) {
    console.error("Error in getPartnerWallet:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all commissions
 */

exports.getCommissions = async (req, res) => {
  try {
    const { page = 1, limit = 50, partnerId, status, startDate, endDate, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {
      transactionType: "COMMISSION_EARNED",
    };

    if (partnerId) {
      query.partnerId = mongoose.Types.ObjectId(partnerId);
    }

    if (search) {
      // 1. Search for matching partners
      const partners = await partnerProfileModel.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { $expr: { $regexMatch: { input: { $toString: "$phoneNumber" }, regex: search, options: "i" } } }
        ]
      }, { _id: 1 }).lean();
      const matchedPartnerIds = partners.map(p => p._id);

      // 2. Search for matching orders
      const orders = await orderModel.find({
        orderId: { $regex: search, $options: "i" }
      }, { _id: 1 }).lean();
      const matchedOrderIds = orders.map(o => o._id);

      // 3. Combine in query
      query.$or = [
        { partnerId: { $in: matchedPartnerIds } },
        { orderId: { $in: matchedOrderIds } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const [total, commissions] = await Promise.all([
      partnerTransactionModel.countDocuments(query),
      partnerTransactionModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("partnerId", "name email")
        .populate("orderId", "orderId status")
        .lean(),
    ]);

    // Calculate summary
    const summary = await partnerTransactionModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          total: { $sum: "$commissionAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const summaryMap = {};
    summary.forEach((s) => {
      summaryMap[s._id] = { total: s.total, count: s.count };
    });

    return res.status(200).json({
      success: true,
      data: commissions,
      summary: summaryMap,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error in getCommissions:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Settle pending commissions (batch)
 */
exports.settleBatch = async (req, res) => {
  try {
    const { partnerIds } = req.body;

    const result = await settlementService.completePendingSettlements(partnerIds);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        settledCount: result.settledCount,
        totalAmount: result.totalAmount,
      },
    });
  } catch (error) {
    console.error("Error in settleBatch:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all withdrawal requests
 */
exports.getWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, partnerId, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};

    if (status) {
      query.status = status;
    }

    if (partnerId) {
      query.partnerId = mongoose.Types.ObjectId(partnerId);
    }

    if (startDate || endDate) {
      query.requestedAt = {};
      if (startDate) {
        query.requestedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.requestedAt.$lte = end;
      }
    }

    const [total, requests] = await Promise.all([
      withdrawalRequestModel.countDocuments(query),
      withdrawalRequestModel
        .find(query)
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("partnerId", "name email phoneNumber")
        .populate("processedBy", "fullName email")
        .lean(),
    ]);

    // Calculate summary
    const summary = await withdrawalRequestModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const summaryMap = {};
    summary.forEach((s) => {
      summaryMap[s._id] = { total: s.total, count: s.count };
    });

    return res.status(200).json({
      success: true,
      data: requests,
      summary: summaryMap,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error in getWithdrawals:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Accept withdrawal request
 */
exports.acceptWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(withdrawalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal ID",
      });
    }

    const result = await settlementService.processWithdrawalRequest(withdrawalId, "ACCEPTED", {
      processedBy: (req.user || req.admin || req.Admin)._id,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.withdrawalRequest,
    });
  } catch (error) {
    console.error("Error in acceptWithdrawal:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Complete withdrawal request
 */
exports.completeWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { transactionRef } = req.body;

    if (!transactionRef) {
      return res.status(400).json({
        success: false,
        message: "Payment reference (transaction ID) is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(withdrawalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal ID",
      });
    }

    const result = await settlementService.processWithdrawalRequest(withdrawalId, "COMPLETED", {
      processedBy: (req.user || req.admin || req.Admin)._id,
      transactionRef,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.withdrawalRequest,
    });
  } catch (error) {
    console.error("Error in completeWithdrawal:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Reject withdrawal request
 */
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(withdrawalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal ID",
      });
    }

    const result = await settlementService.processWithdrawalRequest(withdrawalId, "REJECTED", {
      processedBy: (req.user || req.admin || req.Admin)._id,
      rejectionReason,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.withdrawalRequest,
    });
  } catch (error) {
    console.error("Error in rejectWithdrawal:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all settlement transactions
 */
exports.getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, status, partnerId, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};

    if (type) {
      query.transactionType = type;
    }

    if (status) {
      query.status = status;
    }

    if (partnerId) {
      query.partnerId = mongoose.Types.ObjectId(partnerId);
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }
    // Instead of sequential awaits, run both simultaneously
    const [total, transactions] = await Promise.all([
      partnerTransactionModel.countDocuments(query),
      partnerTransactionModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("partnerId", "name email")
        .populate("orderId", "orderId")
        .populate("withdrawalId", "amount status")
        .lean()
    ]);


    return res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error in getAllTransactions:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get dashboard summary stats
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Total earning across all partners
    const allWallets = await partnerWalletModel.aggregate([
      {
        $group: {
          _id: null,
          totalEarning: { $sum: "$totalEarning" },
          totalWithdrawn: { $sum: "$totalWithdrawn" },
          totalPending: { $sum: "$pendingBalance" },
        },
      },
    ]);

    const stats = allWallets.length > 0 ? allWallets[0] : { totalEarning: 0, totalWithdrawn: 0, totalPending: 0 };

    // Pending withdrawals
    const pendingWithdrawals = await withdrawalRequestModel.aggregate([
      {
        $match: { status: "PENDING" },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const withdrawalStats =
      pendingWithdrawals.length > 0
        ? pendingWithdrawals[0]
        : { total: 0, count: 0 };

    // Partner count
    const partnerCount = await partnerProfileModel.countDocuments({ disable: false });

    return res.status(200).json({
      success: true,
      data: {
        totalEarning: stats.totalEarning || 0,
        totalWithdrawn: stats.totalWithdrawn || 0,
        totalPending: stats.totalPending || 0,
        totalAvailable: (stats.totalEarning || 0) - (stats.totalWithdrawn || 0) - (stats.totalPending || 0) - (withdrawalStats.total || 0),
        pendingWithdrawalsAmount: withdrawalStats.total || 0,
        pendingWithdrawalsCount: withdrawalStats.count || 0,
        activePartners: partnerCount,
      },
    });   
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
