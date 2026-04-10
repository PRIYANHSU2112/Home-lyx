const PlatformFee = require("../models/platformFeeModel");

exports.createPlatformFee = async (req, res) => {
  try {
    const { minAmount, maxAmount, fee } = req.body;

    const slab = await PlatformFee.create({
      minAmount,
      maxAmount,
      fee,
    });

    res.status(201).json({
      success: true,
      data: slab,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



