const Bank = require("../models/bankModel");
const userModel = require("../models/userModel");



const bankValidate = (accountNumber)=>{
     if (!accountNumber) return false;
      const sanitized = accountNumber.toString().trim();

  // only digits allowed
  if (!/^\d+$/.test(sanitized)) return false;

  // length check
  if (sanitized.length < 9 || sanitized.length > 18) return false;

  return true;

}

exports.createBank = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      paymentType,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branchName,
      upiId,
      upiHolderName,
    } = req.body;

    if (!paymentType || !["BANK", "UPI"].includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment type",
      });
    }

    // ================= BANK FLOW =================
    if (paymentType === "BANK") {
      if (!accountNumber || !ifscCode) {
        return res.status(400).json({
          success: false,
          message: "Bank details are required",
        });
      }

      if (!bankValidate(accountNumber)) {
        return res.status(400).json({
          success: false,
          message: "Invalid account number format",
        });
      }
      
      const exists = await Bank.findOne({
       accountNumber,
        paymentType: "BANK",
        ifscCode,
      })
    //   .select("+accountNumber");

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Bank details already added",
        });
      }

      const bank = await Bank.create({
        userId,
        paymentType,
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
        branchName,
      });

      return res.status(201).json({
        success: true,
        message: "Bank details added successfully",
        data: { bankId: bank._id },
      });
    }

    // ================= UPI FLOW =================
    if (paymentType === "UPI") {
      if (!upiId || !upiHolderName) {
        return res.status(400).json({
          success: false,
          message: "UPI details are required",
        });
      }

      const exists = await Bank.findOne({
        userId,
        paymentType: "UPI",
        upiId,
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "UPI already added",
        });
      }

      const upi = await Bank.create({
        userId,
        paymentType,
        upiId,
        upiHolderName,
      });

      return res.status(201).json({
        success: true,
        message: "UPI added successfully",
        data: { bankId: upi._id },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getAllMyBanks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentType } = req.query;

    if (!paymentType || !["BANK", "UPI"].includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment type",
      });
    }

    const banks = await Bank.find({ userId, paymentType }).select(
      "+accountNumber paymentType accountHolderName bankName ifscCode branchName upiId upiHolderName isVerified"
    );

    const response = banks.map((bank) => {
      if (paymentType === "BANK") {
        return {
          _id: bank._id,
          paymentType: bank.paymentType,
          accountHolderName: bank.accountHolderName,
          bankName: bank.bankName,
          ifscCode: bank.ifscCode,
          branchName: bank.branchName,
          accountLast4: bank.accountLast4,
          isVerified: bank.isVerified,
        };
      }

      return {
        _id: bank._id,
        paymentType: bank.paymentType,
        upiId: bank.upiId,
        upiHolderName: bank.upiHolderName,
        isVerified: bank.isVerified,
      };
    });

    res.status(200).json({
      success: true,
      count: response.length,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.updateBank = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bankId } = req.params;

    const bank = await Bank.findOne({ _id: bankId, userId }).select(
      "+accountNumber"
    );

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: "Bank details not found",
      });
    }

    const {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branchName,
      upiId,
      upiHolderName,
    } = req.body;

    // 🔐 BANK UPDATE
    if (bank.paymentType === "BANK") {
      if (accountNumber && !bankValidate(accountNumber)) {
        return res.status(400).json({
          success: false,
          message: "Invalid account number",
        });
      }

      if (accountHolderName) bank.accountHolderName = accountHolderName;
      if (accountNumber) bank.accountNumber = accountNumber;
      if (ifscCode) bank.ifscCode = ifscCode;
      if (bankName) bank.bankName = bankName;
      if (branchName) bank.branchName = branchName;
    }

    // 🔐 UPI UPDATE
    if (bank.paymentType === "UPI") {
      if (upiId) bank.upiId = upiId;
      if (upiHolderName) bank.upiHolderName = upiHolderName;
    }

    // any update → re-verify
    bank.isVerified = false;
    await bank.save();

    res.status(200).json({
      success: true,
      message: "Payment details updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};





exports.deleteBank = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bankId } = req.params;

    const bank = await Bank.findOne({ _id: bankId, userId });

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    // if (bank.isVerified) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Verified payment method cannot be deleted",
    //   });
    // }

    await bank.deleteOne();

    res.status(200).json({
      success: true,
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



exports.getBankById = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { id: userId, role } = req.user;

    const query =
      role === "ADMIN" ? { _id: bankId } : { _id: bankId, userId };

    const bank = await Bank.findOne(query).select(
      "+accountNumber paymentType accountHolderName bankName ifscCode branchName upiId upiHolderName isVerified"
    );

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    const response =
      bank.paymentType === "BANK"
        ? {
            _id: bank._id,
            paymentType: bank.paymentType,
            accountHolderName: bank.accountHolderName,
            bankName: bank.bankName,
            ifscCode: bank.ifscCode,
            branchName: bank.branchName,
            accountLast4: bank.accountLast4,
            isVerified: bank.isVerified,
          }
        : {
            _id: bank._id,
            paymentType: bank.paymentType,
            upiId: bank.upiId,
            upiHolderName: bank.upiHolderName,
            isVerified: bank.isVerified,
          };

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
