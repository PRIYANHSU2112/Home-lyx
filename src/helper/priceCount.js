// helper/priceCalculator.js
exports.calculatePrice = ({ mrp, discount = 0 }) => {
  if (!mrp) return 0;

  const discountedPrice = mrp - (mrp * discount) / 100;

  return Math.round(discountedPrice); // rounding optional
};

// services/cartCalculation.service.js
exports.calculateCartTotals = (cart) => {
  let cartTotal = 0;
  let taxAmount = 0;

  for (let item of cart.items) {
    const price = Number(item.unitPrice) * Number(item.quantity);
    cartTotal += price;

    const taxPercent = item.product?.taxId?.taxPercent || 0;
    const itemTax = (price * taxPercent) / 100;

    taxAmount += itemTax;
  }

  return {
    cartTotal,
    taxAmount,
    netAmount: cartTotal + taxAmount,
  };
};
