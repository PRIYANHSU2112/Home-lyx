// priyanshu

const crypto = require("crypto");
const walletModel = require("../models/walletModel");
const transactionModel = require("../models/ecommerce/transactionModel");
const { razorpay } = require("../../config/razorpay");

//  Helper: create wallet if not exists
const getOrCreateWallet = async (customerId) => {
  let wallet = await walletModel.findOne({ customerId });
  if (!wallet) wallet = await walletModel.create({ customerId, balance: 0 });
  return wallet;
};



// 1) Get Wallet Balance
exports.getMyWallet = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    return res.status(200).json({ success: true, data: wallet });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2) Create Razorpay Order for Wallet Topup
exports.createWalletTopupOrder = async (req, res) => {
  try {
    console.log(" createWalletTopupOrder HIT");
    console.log("BODY:", req.body);
    console.log("USER:", req.user);
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Valid amount required" });
    }

    const userShort = String(req.user._id).slice(-6);

    const razorpayOrder = await razorpay.orders.create({
      amount: Number(amount) * 100,
      currency: "INR",
      receipt: `w_${userShort}_${Date.now()}`,
    });

    // Save transaction as WALLET TOPUP (CREATED)
    await transactionModel.create({
      customerId: req.user._id,
      amount: Number(amount),
      currency: "INR",

      paymentGateway: "RAZORPAY",
      paymentMethod: "WALLET",

      walletType: "CREDIT",
      walletPurpose: "TOPUP",

      razorpayOrderId: razorpayOrder.id,
      status: "PENDING",
    });

    return res.status(200).json({
      success: true,
      message: "Wallet topup order created",
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: Number(amount),
        razorpayKey: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    console.log(" Razorpay error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
      error: err,
    });
  }
};

// 3) Verify Razorpay Payment and Credit Wallet
exports.verifyWalletTopup = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });
    }

    // verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await transactionModel.findOneAndUpdate(
        {
          razorpayOrderId: razorpay_order_id,
          walletPurpose: "TOPUP",
          customerId: req.user._id,
        },
        { status: "FAILED" },
      );

      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    // find transaction
    const tx = await transactionModel.findOne({
      razorpayOrderId: razorpay_order_id,
      walletPurpose: "TOPUP",
      customerId: req.user._id,
    });

    if (!tx) {
      return res
        .status(404)
        .json({ success: false, message: "Topup transaction not found" });
    }

    // already credited safety
    if (tx.status === "SUCCESS") {
      const wallet = await getOrCreateWallet(tx.customerId);
      return res.status(200).json({
        success: true,
        message: "Wallet already credited",
        data: wallet,
      });
    }

    // credit wallet balance
    const wallet = await walletModel.findOneAndUpdate(
      { customerId: tx.customerId },
      { $inc: { balance: tx.amount } },
      { new: true, upsert: true },
    );

    // update transaction success
    tx.status = "SUCCESS";
    tx.razorpayPaymentId = razorpay_payment_id;
    tx.razorpaySignature = razorpay_signature;
    await tx.save();

    return res.status(200).json({
      success: true,
      message: "Wallet credited successfully",
      data: wallet,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 4) Wallet History (Statement)
// exports.getWalletHistory = async (req, res) => {
//   try {
//     const { page = 1, limit = 10 } = req.query;
//     const skip = (page - 1) * limit;

//     const filter = {
//       customerId: req.user._id,
//       paymentMethod: "WALLET",
//     };

//     const [history, total] = await Promise.all([
//       transactionModel
//         .find(filter)
//         .populate("orderId")
//         .populate("bookingId")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(Number(limit)),

//       transactionModel.countDocuments(filter),
//     ]);

//     return res.status(200).json({
//       success: true,
//       message: "Wallet history fetched successfully",
//       pagination: {
//         totalRecords: total,
//         totalPages: Math.ceil(total / limit),
//         currentPage: Number(page),
//       },
//       data: history,
//     });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

exports.getWalletHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {
  customerId: req.user._id,
  paymentMethod: "WALLET",

  status: { $in: ["SUCCESS", "FAILED", "REFUNDED","CREATED"] },

};


    // get wallet + transactions together
    const [wallet, history, total] = await Promise.all([
      getOrCreateWallet(req.user._id),

      transactionModel
        .find(filter)
        .populate("orderId")
        .populate("bookingId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),

      transactionModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Wallet history fetched successfully",
      wallet: wallet, // wallet details
      pagination: {
        totalRecords: total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
      },
      transactions: history, // transaction list
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
