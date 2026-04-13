const settlementService = require("../services/settlementService");
const partnerWalletModel = require("../models/partnerWallet");
const partnerTransactionModel = require("../models/partnerTransaction");
const withdrawalRequestModel = require("../models/withdrawalRequest");
const mongoose = require("mongoose");

/**
 * Get partner's wallet details and monthly growth
 */
exports.getMyWallet = async (req, res) => {
  try {
    if (!req.partnerProfile?._id) {
      return res.status(401).json({
        success: false,
        message: "Partner not authenticated",
      });
    }

    const partnerId = req.partnerProfile._id;
    const result = await settlementService.getPartnerWalletSummary(partnerId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error,
      });
    }

    // --- Compute Monthly Earning Growth ---
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [currentMonthData, previousMonthData] = await Promise.all([
      partnerTransactionModel.aggregate([
        {
          $match: {
            partnerId: mongoose.Types.ObjectId(partnerId),
            transactionType: "COMMISSION_EARNED",
            status: "SETTLED",
            createdAt: { $gte: startOfCurrentMonth }
          }
        },
        { $group: { _id: null, total: { $sum: "$commissionAmount" } } }
      ]),
      partnerTransactionModel.aggregate([
        {
          $match: {
            partnerId: mongoose.Types.ObjectId(partnerId),
            transactionType: "COMMISSION_EARNED",
            status: "SETTLED",
            createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth }
          }
        },
        { $group: { _id: null, total: { $sum: "$commissionAmount" } } }
      ])
    ]);

    const currentEarnings = currentMonthData.length > 0 ? currentMonthData[0].total : 0;
    const previousEarnings = previousMonthData.length > 0 ? previousMonthData[0].total : 0;

    let growthPercentage = 0;
    if (previousEarnings === 0) {
      growthPercentage = currentEarnings > 0 ? 100 : 0;
    } else {
      growthPercentage = ((currentEarnings - previousEarnings) / previousEarnings) * 100;
    }
    growthPercentage = Number(growthPercentage.toFixed(2));

    return res.status(200).json({
      success: true,
      data: result.wallet,
      pendingCommissions: result.pendingCommissions,
      earningGrowth: {
        currentMonthEarnings: currentEarnings,
        previousMonthEarnings: previousEarnings,
        growthPercentage: growthPercentage,
        isPositive: growthPercentage >= 0
      }
    });
  } catch (error) {
    console.error("Error in getMyWallet:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get partner's transaction history
 */
exports.getTransactions = async (req, res) => {
  try {
    if (!req.partnerProfile?._id) {
      return res.status(401).json({
        success: false,
        message: "Partner not authenticated",
      });
    }

    const { page = 1, limit = 20, type, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {
      partnerId: req.partnerProfile._id,
    };

    if (type) {
      query.transactionType = type;
    }

    if (status) {
      query.status = status;
    }

    const total = await partnerTransactionModel.countDocuments(query);
    const transactions = await partnerTransactionModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

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
    console.error("Error in getTransactions:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Request withdrawal
 */
exports.requestWithdrawal = async (req, res) => {
  try {
    if (!req.partnerProfile?._id) {
      return res.status(401).json({
        success: false,
        message: "Partner not authenticated",
      });
    }

    const { amount, bankDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid withdrawal amount is required",
      });
    }

    if (!bankDetails || Object.keys(bankDetails).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Bank details are required",
      });
    }

    const requiredBankFields = [
      "accountHolderName",
      "accountNumber",
      "bankName",
      "ifscCode",
    ];
    for (const field of requiredBankFields) {
      if (!bankDetails[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    const result = await settlementService.createWithdrawalRequest(
      req.partnerProfile._id,
      amount,
      bankDetails,
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.withdrawalRequest,
    });
  } catch (error) {
    console.error("Error in requestWithdrawal:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get partner's withdrawal requests
 */
exports.getWithdrawalRequests = async (req, res) => {
  try {
    if (!req.partnerProfile?._id) {
      return res.status(401).json({
        success: false,
        message: "Partner not authenticated",
      });
    }

    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {
      partnerId: req.partnerProfile._id,
    };

    if (status) {
      query.status = status;
    }

    const [total, requests] = await Promise.all([
      withdrawalRequestModel.countDocuments(query),

      withdrawalRequestModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("-bankDetails.accountNumber"),
    ]); // Don't expose full account number to partner

    return res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error in getWithdrawalRequests:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get pending commissions (awaiting settlement)
 */
exports.getPendingCommissions = async (req, res) => {
  try {
    if (!req.partnerProfile?._id) {
      return res.status(401).json({
        success: false,
        message: "Partner not authenticated",
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    const matchQuery = {
      partnerId: req.partnerProfile._id,
      transactionType: "COMMISSION_EARNED",
      status: "PENDING",
    };

    // Run all 3 DB calls in parallel
    const [total, pendingCommissions, totals] = await Promise.all([
      // 1. Count for pagination
      partnerTransactionModel.countDocuments(matchQuery),

      // 2. Paginated list
      partnerTransactionModel
        .find(matchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate("orderId", "orderId status createdAt")
        .lean(),

      // 3. Aggregate totals
      partnerTransactionModel.aggregate([
        {
          $match: {
            ...matchQuery,
            partnerId: mongoose.Types.ObjectId(req.partnerProfile._id),
          },
        },
        {
          $group: {
            _id: null,
            totalCommission: { $sum: "$commissionAmount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const summary =
      totals.length > 0 ? totals[0] : { totalCommission: 0, count: 0 };

    return res.status(200).json({
      success: true,
      data: pendingCommissions,
      summary: {
        totalPending: summary.totalCommission,
        count: summary.count,
        expectedSettlementDate: "Settles daily",
      },
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error("Error in getPendingCommissions:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get wallet summary statistics
 */
exports.getWalletStats = async (req, res) => {
  try {
    if (!req.partnerProfile?._id) {
      return res.status(401).json({
        success: false,
        message: "Partner not authenticated",
      });
    }

    const wallet = await partnerWalletModel.findOne({
      partnerId: req.partnerProfile._id,
    });

    if (!wallet) {
      return res.status(200).json({
        success: true,
        data: {
          totalEarning: 0,
          totalWithdrawn: 0,
          balance: 0,
          pendingWithdrawn: 0,
          pendingBalance: 0,
          lastSettlementDate: null,
        },
      });
    }

    // Get monthly earnings
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyEarnings = await partnerTransactionModel.aggregate([
      {
        $match: {
          partnerId: mongoose.Types.ObjectId(req.partnerProfile._id),
          transactionType: "COMMISSION_EARNED",
          status: "SETTLED",
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$commissionAmount" },
        },
      },
    ]);

    const monthlyTotal =
      monthlyEarnings.length > 0 ? monthlyEarnings[0].total : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalEarning: wallet.totalEarning || 0,
        totalWithdrawn: wallet.totalWithdrawn || 0,
        balance: wallet.balance || 0,
        pendingWithdrawn: wallet.pendingWithdrawn || 0,
        pendingBalance: wallet.pendingBalance || 0,
        lastSettlementDate: wallet.lastSettlementDate,
        monthlyEarnings: monthlyTotal,
        availableForWithdrawal: (wallet.balance || 0),
      },
    });
  } catch (error) {
    console.error("Error in getWalletStats:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
