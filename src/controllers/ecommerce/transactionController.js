const transactionModel = require("../../models/ecommerce/transactionModel")


exports.getAllTransaction = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const { search } = req.query;

    
    let filter = {};
    console.log("Search query:", search);
    if (search) {
      filter.razorpayOrderId = {
        $regex: search,
        $options: "i" // case-insensitive
      };
    }

    const [transactions, total] = await Promise.all([
      transactionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      transactionModel.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
      data: transactions
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message
    });
  }
};


exports.getTransactionById = async (req, res) => {
    try {
        const {transactionId} = req.params;

        const transaction = await transactionModel.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            })
        }

        res.status(200).json({
            success: true,
            message: "Transaction fetched successfully",
            data: transaction
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        })
    }
}


exports.getFilterTransactionByState = async (req, res) => {
    try {
        const {state} = req.query;
        console.log("Requested state:", state);

        const allowedStatus = ["PENDING", "SUCCESS", "FAILED", "REFUNDED","CREATED"];
        if(!allowedStatus.includes(state)){
            return res.status(400).json({
                success: false,
                message: "Invalid transaction state"
            })
        }

        const transactions = await transactionModel.find({status: state}).sort({createdAt: -1});

        if(transactions.length === 0){
            return res.status(404).json({
                success: false,
                message: "No transactions found for the given state"
            })
        }

        res.status(200).json({
            success:true,
            message: "Transactions fetched successfully",
            data: transactions
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        })
    }
}


const mongoose = require("mongoose");

exports.getTransactionByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;

    //  Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customerId",
      });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const { search } = req.query;

    // 🔍 Filter
    let filter = {
      customerId: customerId,
    };

    // Optional search by transactionId
    if (search) {
      filter.transactionId = {
        $regex: search,
        $options: "i",
      };
    }

    const [transactions, total] = await Promise.all([
      transactionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      transactionModel.countDocuments(filter),
    ]);


    if(transactions.length === 0){
      return res.status(404).json({
        success: false,
        message: "No transactions found for the given customerId",
      });
    }
   

    
    return res.status(200).json({
      success: true,
      customerId,
      page,
      limit,
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
      data: transactions,
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


exports.getTransactionsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const { search, status, paymentMethod } = req.query;

    // ✅ Base filter (user → customerId mapping)
    let filter = {
      customerId: userId,
    };

    // ✅ Optional status filter
    if (status) {
      filter.status = status;
    }

    // ✅ Optional payment method filter
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    // ✅ Optional search
    if (search) {
      filter.$or = [
        { razorpayOrderId: { $regex: search, $options: "i" } },
        { razorpayPaymentId: { $regex: search, $options: "i" } },
        mongoose.Types.ObjectId.isValid(search)
          ? { _id: search }
          : null,
      ].filter(Boolean);
    }

    const [transactions, total] = await Promise.all([
      transactionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      transactionModel.countDocuments(filter),
    ]);

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No transactions found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      userId,
      page,
      limit,
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
      data: transactions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
