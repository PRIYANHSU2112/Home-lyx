const partnerWalletModel = require("../models/partnerWallet");
const partnerTransactionModel = require("../models/partnerTransaction");
const withdrawalRequestModel = require("../models/withdrawalRequest");
const ecommerceOrderModel = require("../models/ecommerce/orderModel");
const mongoose = require("mongoose");

class SettlementService {
  /**
   * Create or get partner wallet
   */
  async getOrCreateWallet(partnerId) {
    let wallet = await partnerWalletModel.findOne({ partnerId });
    if (!wallet) {
      wallet = new partnerWalletModel({ partnerId });
      await wallet.save();
    }
    return wallet;
  }

  /**
   * Settle commission from delivered eCommerce order
   * Called when order reaches DELIVERED status
   */

  async settleOrderCommission(orderId, productIndex = null) {
    try {
      console.log(`Starting settlement for order ${orderId}, productIndex: ${productIndex}`);
      const order = await ecommerceOrderModel.findById(orderId).populate({
        path: 'product.productId',
        populate: {
          path: 'categoryId'
        }
      });
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }
      console.log(`Order found: ${order._id}`);

      const transactions = [];

      // If productIndex specified, settle only that product; otherwise settle all
      const items = productIndex !== null ? [order.product[productIndex]] : order.product;
      console.log(`Processing ${items.length} items`);

      for (const product of items) {
        if (!product || !product.productId || !product.productId.partnerId) {
          console.log(`Skipping product without partnerId: ${product?.productId}`);
          continue; // Skip products without partner (admin products)
        }
        console.log(`Processing product ${product.productId._id}, partnerId: ${product.productId.partnerId}`);

        // Check if already settled for this product
        const existing = await partnerTransactionModel.findOne({
          orderId,
          orderType: "ECOMMERCE",
          transactionType: "COMMISSION_EARNED",
          "metadata.productId": product.productId._id?.toString(),
        });

        if (existing) {
          console.log(`Commission already settled for product ${product.productId._id} in order ${orderId}`);
          transactions.push(existing);
          continue;
        }

        // Get or create wallet
        const wallet = await this.getOrCreateWallet(product.productId.partnerId);
        console.log(`Wallet for partner ${product.productId.partnerId}: balance ${wallet.balance}`);

        // Calculate commission
        console.log(`Calculating commission for product ${product},`);
        const commissionPercent = product.productId.categoryId?.adminCommission || product.productId.adminCommission || 0; // from category, fallback to product, default 10%
        const commissionAmount = (product.price * product.quantity) * (commissionPercent / 100);
        console.log(`Commission calculated: percent ${commissionPercent}, amount ${commissionAmount}`);

        // Create transaction for commission earned
        const transaction = new partnerTransactionModel({
          partnerId: product.productId.partnerId,
          orderId,
          orderType: "ECOMMERCE",
          amount: product.price || 0,
          commissionPercentage: commissionPercent,
          commissionAmount: commissionAmount,
          netAmount: product.price - commissionAmount,
          transactionType: "COMMISSION_EARNED",
          status: "COMPLETED",
          description: `Commission from eCommerce order ${order.orderId || orderId}`,
          metadata: {
            productId: product.productId._id?.toString(),
            quantity: product.quantity,
            settledAt: new Date(),
          },
        });

        await transaction.save();
        transactions.push(transaction);
        console.log(`Transaction saved: ${transaction._id}`);

        // Update wallet balance
        wallet.balance = (wallet.balance || 0) + commissionAmount;
        wallet.totalEarning = (wallet.totalEarning || 0) + commissionAmount;
        wallet.lastSettlementDate = new Date();
        await wallet.save();
        console.log(`Wallet updated: new balance ${wallet.balance}`);
      }

      console.log(`Settlement completed for ${transactions.length} products in order ${orderId}`);
      return {
        success: true,
        transactions,
        message: `Commission settled for ${transactions.length} product(s) in order ${orderId}`,
      };
    } catch (error) {
      console.error("Error in settleOrderCommission:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Complete pending settlements (move from pending to balance)
   * Typically called by scheduled cron job
   */
  async completePendingSettlements(partnerIds = null) {
    try {
      const query = {
        transactionType: "COMMISSION_EARNED",
        status: "PENDING",
      };

      if (partnerIds && partnerIds.length > 0) {
        query.partnerId = { $in: partnerIds };
      }

      const pendingTransactions = await partnerTransactionModel.find(query);

      if (pendingTransactions.length === 0) {
        return {
          success: true,
          settledCount: 0,
          totalAmount: 0,
          message: "No pending settlements found",
        };
      }

      // Group by partner
      const byPartner = {};
      for (const tx of pendingTransactions) {
        const pId = tx.partnerId.toString();
        if (!byPartner[pId]) {
          byPartner[pId] = [];
        }
        byPartner[pId].push(tx);
      }

      let totalSettled = 0;
      let totalAmount = 0;

      // Update each partner
      for (const partnerId in byPartner) {
        const transactions = byPartner[partnerId];
        let totalCommission = 0;

        // Update transaction statuses to SETTLED
        for (const tx of transactions) {
          tx.status = "SETTLED";
          await tx.save();
          totalCommission += tx.commissionAmount || 0;
        }

        // Update wallet
        const wallet = await partnerWalletModel.findOne({
          partnerId,
        });

        if (wallet) {
          wallet.balance = (wallet.balance || 0) + totalCommission;
          wallet.totalEarning = (wallet.totalEarning || 0) + totalCommission;
          wallet.pendingBalance = Math.max(0, (wallet.pendingBalance || 0) - totalCommission);
          wallet.lastSettlementDate = new Date();
          await wallet.save();

          totalSettled += transactions.length;
          totalAmount += totalCommission;
        }
      }

      return {
        success: true,
        settledCount: totalSettled,
        totalAmount,
        message: `Settled ${totalSettled} commissions totaling ₹${totalAmount.toFixed(2)}`,
      };
    } catch (error) {
      console.error("Error in completePendingSettlements:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create withdrawal request
   */
  async createWithdrawalRequest(partnerId, amount, bankDetails) {
    try {
      if (amount <= 0) {
        throw new Error("Withdrawal amount must be greater than 0");
      }

      const wallet = await partnerWalletModel.findOne({ partnerId });
      if (!wallet) {
        throw new Error("Partner wallet not found");
      }

      // Check available balance
      const requestedAmount = typeof amount === "string" ? parseFloat(amount) : amount;
      if (Number.isNaN(requestedAmount)) {
        throw new Error("Valid withdrawal amount is required");
      }
      if (requestedAmount > wallet.balance) {
        throw new Error(
          `Insufficient balance. Available: ₹${wallet.balance.toFixed(2)}, Requested: ₹${requestedAmount.toFixed(2)}`
        );
      }

      // Deduct from balance and add to pending withdrawn
      wallet.balance = Math.max(0, (wallet.balance || 0) - requestedAmount);
      wallet.pendingWithdrawn = (wallet.pendingWithdrawn || 0) + requestedAmount;
      await wallet.save();

      // Create withdrawal request
      const withdrawalRequest = new withdrawalRequestModel({
        partnerId,
        amount: requestedAmount,
        bankDetails,
        status: "PENDING",
      });
      await withdrawalRequest.save();

      // Create transaction record
      const transaction = new partnerTransactionModel({
        partnerId,
        withdrawalId: withdrawalRequest._id,
        amount,
        commissionAmount: amount,
        transactionType: "WITHDRAWAL_REQUESTED",
        status: "PENDING",
        description: `Withdrawal request for ₹${amount}`,
        metadata: {
          withdrawalRequestId: withdrawalRequest._id.toString(),
          bankDetails: bankDetails,
        },
      });
      await transaction.save();

      return {
        success: true,
        withdrawalRequest,
        message: `Withdrawal request created for ₹${amount}`,
      };
    } catch (error) {
      console.error("Error in createWithdrawalRequest:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process withdrawal request (approve/reject)
   */
  async processWithdrawalRequest(withdrawalRequestId, action, actionData = {}) {
    try {
      if (!["APPROVED", "REJECTED"].includes(action)) {
        throw new Error("Action must be APPROVED or REJECTED");
      }

      const withdrawalRequest = await withdrawalRequestModel.findById(withdrawalRequestId);
      if (!withdrawalRequest) {
        throw new Error("Withdrawal request not found");
      }

      if (withdrawalRequest.status !== "PENDING") {
        throw new Error(`Cannot process withdrawal in ${withdrawalRequest.status} status`);
      }

      const wallet = await partnerWalletModel.findOne({ partnerId: withdrawalRequest.partnerId });
      if (!wallet) {
        throw new Error("Partner wallet not found");
      }

      if (action === "APPROVED") {
        // Reduce pending withdrawn and increase withdrawn
        wallet.pendingWithdrawn = Math.max(0, (wallet.pendingWithdrawn || 0) - withdrawalRequest.amount);
        wallet.totalWithdrawn = (wallet.totalWithdrawn || 0) + withdrawalRequest.amount;
        await wallet.save();

        // Update withdrawal request
        withdrawalRequest.status = "APPROVED";
        withdrawalRequest.processedBy = actionData.processedBy;
        withdrawalRequest.processedAt = new Date();
        withdrawalRequest.transactionRef = actionData.transactionRef || null;
        await withdrawalRequest.save();

        // Update transaction to COMPLETED
        const transaction = await partnerTransactionModel.findOne({
          withdrawalId: withdrawalRequestId,
          transactionType: "WITHDRAWAL_REQUESTED",
        });
        if (transaction) {
          transaction.status = "COMPLETED";
          transaction.description = `Withdrawal of ₹${withdrawalRequest.amount} approved on ${new Date().toLocaleDateString()}`;
          await transaction.save();
        }

        // Create approval transaction record
        const approvalTx = new partnerTransactionModel({
          partnerId: withdrawalRequest.partnerId,
          withdrawalId: withdrawalRequestId,
          amount: withdrawalRequest.amount,
          commissionAmount: withdrawalRequest.amount,
          transactionType: "WITHDRAWAL_APPROVED",
          status: "COMPLETED",
          description: `Withdrawal approved: ₹${withdrawalRequest.amount}`,
          metadata: {
            withdrawalRequestId: withdrawalRequestId.toString(),
            transactionRef: actionData.transactionRef || null,
          },
        });
        await approvalTx.save();

        return {
          success: true,
          withdrawalRequest,
          message: `Withdrawal of ₹${withdrawalRequest.amount} approved`,
        };
      } else {
        // REJECTED - refund amount to balance and reduce pending withdrawn
        wallet.pendingWithdrawn = Math.max(0, (wallet.pendingWithdrawn || 0) - withdrawalRequest.amount);
        wallet.balance = (wallet.balance || 0) + withdrawalRequest.amount;
        await wallet.save();

        // Update withdrawal request
        withdrawalRequest.status = "REJECTED";
        withdrawalRequest.processedBy = actionData.processedBy;
        withdrawalRequest.processedAt = new Date();
        withdrawalRequest.rejectionReason = actionData.rejectionReason;
        await withdrawalRequest.save();

        // Update transaction to CANCELLED
        const transaction = await partnerTransactionModel.findOne({
          withdrawalId: withdrawalRequestId,
          transactionType: "WITHDRAWAL_REQUESTED",
        });
        if (transaction) {
          transaction.status = "CANCELLED";
          transaction.description = `Withdrawal rejected: ${actionData.rejectionReason || "No reason provided"}`;
          await transaction.save();
        }

        // Create rejection transaction record
        const rejectionTx = new partnerTransactionModel({
          partnerId: withdrawalRequest.partnerId,
          withdrawalId: withdrawalRequestId,
          amount: withdrawalRequest.amount,
          commissionAmount: withdrawalRequest.amount,
          transactionType: "WITHDRAWAL_REJECTED",
          status: "COMPLETED",
          description: `Withdrawal rejected: ₹${withdrawalRequest.amount} refunded to balance`,
          metadata: {
            withdrawalRequestId: withdrawalRequestId.toString(),
            rejectionReason: actionData.rejectionReason || null,
          },
        });
        await rejectionTx.save();

        return {
          success: true,
          withdrawalRequest,
          message: `Withdrawal of ₹${withdrawalRequest.amount} rejected and refunded`,
        };
      }
    } catch (error) {
      console.error("Error in processWithdrawalRequest:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle order refund - reverse commission
   */
  async handleOrderRefund(orderId, refundAmount, isFullRefund = false) {
    try {
      const order = await ecommerceOrderModel.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      const refundTransactions = [];

      for (const product of order.product) {
        if (!product.partnerId) continue;

        // Find commission transaction for this product
        const commissionTx = await partnerTransactionModel.findOne({
          orderId,
          orderType: "ECOMMERCE",
          "metadata.productId": product.productId?.toString(),
          transactionType: "COMMISSION_EARNED",
        });

        if (!commissionTx) {
          continue;
        }

        // Calculate refund commission
        let refundCommission = 0;
        if (isFullRefund) {
          refundCommission = commissionTx.commissionAmount || 0;
        } else {
          // Proportional refund
          const itemTotal = product.price || 0;
          refundCommission = itemTotal > 0 ? (refundAmount * (commissionTx.commissionAmount || 0)) / itemTotal : 0;
        }

        if (refundCommission <= 0) {
          continue;
        }

        // Get wallet
        const wallet = await partnerWalletModel.findOne({ partnerId: product.partnerId });
        if (!wallet) {
          continue;
        }

        // Reverse commission based on transaction status
        if (commissionTx.status === "PENDING") {
          wallet.pendingBalance = Math.max(0, (wallet.pendingBalance || 0) - refundCommission);
        } else if (commissionTx.status === "SETTLED") {
          wallet.balance = Math.max(0, (wallet.balance || 0) - refundCommission);
          wallet.totalEarning = Math.max(0, (wallet.totalEarning || 0) - refundCommission);
        }
        await wallet.save();

        // Create refund transaction
        const refundTx = new partnerTransactionModel({
          partnerId: product.partnerId,
          orderId,
          orderType: "ECOMMERCE",
          amount: refundAmount,
          commissionAmount: refundCommission,
          transactionType: "REFUND_CREDIT",
          status: "COMPLETED",
          description: isFullRefund
            ? `Full refund for order ${order.orderId || orderId}: ₹${refundCommission} reversed`
            : `Partial refund for order ${order.orderId || orderId}: ₹${refundCommission} reversed`,
          metadata: {
            productId: product.productId?.toString(),
            refundAmount,
            isFullRefund,
          },
        });
        await refundTx.save();
        refundTransactions.push(refundTx);
      }

      return {
        success: true,
        refundTransactions,
        message: `Handled refund of ₹${refundAmount} for order ${orderId}`,
      };
    } catch (error) {
      console.error("Error in handleOrderRefund:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get partner wallet summary
   */
  async getPartnerWalletSummary(partnerId) {
    try {
      const wallet = await this.getOrCreateWallet(partnerId);

      // Get pending commissions
      const pendingCommissions = await partnerTransactionModel.aggregate([
        {
          $match: {
            partnerId,
            transactionType: "COMMISSION_EARNED",
            status: "PENDING",
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            total: { $sum: "$commissionAmount" },
          },
        },
      ]);

      const pendingCount = pendingCommissions.length > 0 ? pendingCommissions[0].count : 0;
      const pendingTotal = pendingCommissions.length > 0 ? pendingCommissions[0].total : 0;

      return {
        success: true,
        wallet: {
          totalEarning: wallet.totalEarning || 0,
          totalWithdrawn: wallet.totalWithdrawn || 0,
          balance: wallet.balance || 0,
          pendingWithdrawn: wallet.pendingWithdrawn || 0,
          pendingBalance: wallet.pendingBalance || 0,
          lastSettlementDate: wallet.lastSettlementDate,
          availableForWithdrawal: (wallet.balance || 0),
        },
        pendingCommissions: {
          count: pendingCount,
          total: pendingTotal,
        },
      };
    } catch (error) {
      console.error("Error in getPartnerWalletSummary:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new SettlementService();
