const PlatformFee = require("../models/platformFeeModel");

async function calculatePlatformFee(totalAmount) {
  const slab = await PlatformFee.findOne({
    isActive: true,
    minAmount: { $lte: totalAmount },
    $or: [
      { maxAmount: { $gte: totalAmount } },
      { maxAmount: null }
    ]
  }).sort({ minAmount: -1 })
   .select('fee')
   .lean();

  return slab ? slab.fee : 0;
}

module.exports = {
  calculatePlatformFee,
};
