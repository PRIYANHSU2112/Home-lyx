let cartModel = require("../models/cartModel");
let userModel = require("../models/userModel");
let couponModel = require("../models/couponModel");
let taxModel = require("../models/taxModel");
let membershipModel = require("../models/memberShipModel");
let CartModel = require("../models/ecommerce/CartModel");
let ProductModel = require("../models/ecommerce/productModel");
let couponUsed = require("../models/isUsedCouponModel");
let companyModel = require("../models/commpanyModel");
const { calculatePlatformFee } = require("../helper/platformFee");
const mongoose = require("mongoose");

// ========================= Date Check ========================= ||

function isDateInRange(startDate, endDate) {
  let parsedStartDate = new Date(startDate);
  let parsedEndDate = new Date(endDate);
  let currentDate = new Date();
  if (
    parsedEndDate >= parsedStartDate &&
    parsedStartDate <= currentDate &&
    parsedStartDate.getFullYear() === currentDate.getFullYear()
  ) {
    return true;
  } else {
    return false;
  }
}

// ========================= Bill Detail ========================= ||

exports.billDetail = async (req, res, next) => {
  let obj = {};
  if (req.params.customerId) {
    obj.customerId = req.User._id}
  if (req.params.userId) {
    obj.customerId = req.params.userId;
  }
  let netAmount = 0;
  let membershipDiscount = 0;
  let membershipDiscountPercent = 0;
  let membershipId;
  let orderTotal = 0;
  let taxId;
  let taxPercentage = 0;
  let couponCode;
  let couponDiscount = 0;
  let totalOfferDiscount = 0;
  // console.log(req.params.customerId)
  let Cart = await cartModel
    .find(obj)
    .populate({ path: "items.product", populate: "taxId" });
  let User = await userModel.findOne({ _id: req.params.customerId });
  //  tax jjjj
  // let tax = await taxModel.findOne();
  let coupon = await couponModel.findOne({
    couponCode: req.query.couponCode,
    type: "CATEGORY",
  });
  if (!Cart.length) {
    next();
  } else {
    // console.log(Cart)
    // let taxPercent = a.some((e) => e == false) ? null : taxCheck / 100;
    let totalPrice = 0;
    let total = 0;
    let price = 0;
    let taxCheck;
    let a = [];
    for (let i = 0; i < Cart.length; i++) {
      taxCheck = Cart[0].productId.taxId.taxPercent;
      if (Cart[i].productId.taxId.taxPercent == taxCheck) {
        a.push(true);
      } else {
        a.push(false);
      }
      // console.log(Cart[i].price)
      // console.log(Cart[i].productId.taxId.taxPercent)
      totalPrice += (Cart[i].price * Cart[i].productId.taxId.taxPercent) / 100;
      // console.log(totalPrice)
      price += Cart[i].price;
      total = totalPrice + price;
    }
    // console.log(User);
    if (User?.membership?.discountPercent != undefined) {
      const isInRange = isDateInRange(
        User.membership.startDate,
        User.membership.endDate
      );
      if (!isInRange) {
        req.message = "Membership Is Expair..";
        req.netAmount = price;
        req.orderTotal = Math.ceil(total);
        req.taxAmount = totalPrice;
        req.taxPercentage = a.some((e) => e == false) ? null : taxCheck;
        req.Cart = Cart;
        req.success = false;
        next();
      }
      req.membershipId = User.membership.membershipId;
      req.membershipDiscountPercent = User.membership.discountPercent;
      req.membershipDiscount = (total * User.membership.discountPercent) / 100;
      req.netAmount = price;
      req.orderTotal = Math.ceil(total - req.membershipDiscount);
      req.taxAmount = totalPrice;
      req.success = true;
      req.taxPercentage = a.some((e) => e == false) ? null : taxCheck;
      req.totalOfferDiscount = (total * User.membership.discountPercent) / 100;
      req.Cart = Cart;
      next();
    }
    if (req.query.membership == "true") {
      let Membership = await membershipModel.findOne();
      req.membershipId = Membership._id;
      req.membershipDiscountPercent = Membership.discountPercent;
      req.membershipDiscount = (total * Membership.discountPercent) / 100;
      req.netAmount = price + Membership.price;
      req.orderTotal = Math.ceil(
        total - req.membershipDiscount + Membership.price
      );
      req.taxAmount = totalPrice;
      req.success = true;
      req.taxPercentage = a.some((e) => e == false) ? null : taxCheck;
      req.totalOfferDiscount = (total * Membership.discountPercent) / 100;
      req.Cart = Cart;
      next();
    }
    if (req.query.membershipId) {
      let Memberships = await membershipModel.findOne({
        _id: req.query.membershipId,
      });
      req.success = true;
      req.membershipId = Memberships._id;
      req.membershipDiscountPercent = Memberships.discountPercent;
      req.membershipDiscount = (total * Memberships.discountPercent) / 100;
      req.netAmount = price + Memberships.price;
      req.orderTotal = Math.ceil(
        total - req.membershipDiscount + Memberships.price
      );
      // req.taxId = tax._id;
      req.taxAmount = totalPrice;
      req.taxPercentage = a.some((e) => e == false) ? null : taxCheck;
      req.totalOfferDiscount = (total * Memberships.discountPercent) / 100;
      req.Cart = Cart;
      next();
    }
    if (req.query.couponCode && User.membership.discountPercent == undefined) {
      if (!coupon) {
        req.message = `Coupon Not Found`;
        req.netAmount = price;
        req.success = false;
        req.orderTotal = Math.ceil(total);
        req.taxAmount = totalPrice;
        req.taxPercentage = a.some((e) => e == false) ? null : taxCheck;
        req.Cart = Cart;
        next();
      }
      if (coupon?.disable == true) {
        req.message = "Coupon Not Applied";
        req.netAmount = price;
        req.orderTotal = Math.ceil(total);
        req.success = false;
        req.taxAmount = totalPrice;
        req.taxPercentage = a.some((e) => e == false) ? null : taxCheck;
        req.Cart = Cart;
        next();
      }
      const isInRange = isDateInRange(coupon.startDate, coupon.expiryDate);
      if (!isInRange) {
        req.message = `Coupon Is Expair..`;
        req.netAmount = price;
        req.success = false;
        req.orderTotal = Math.ceil(total);
        req.taxAmount = totalPrice;
        req.taxPercentage = a.some((e) => e == false) ? null : taxCheck;
        req.Cart = Cart;
        next();
      }
      if (total <= coupon.minOrderPrice) {
        req.message = `Coupon Is Not Apply Because MinmumOrderPrice ${coupon.minOrderPrice}`;
        req.netAmount = price;
        req.orderTotal = Math.ceil(total);
        req.success = false;
        req.taxAmount = totalPrice;
        req.taxPercentage = a.some((e) => e == false) ? null : taxCheck;
        req.Cart = Cart;
        next();
      }
      if (coupon.couponQuantity == 0) {
        req.message = `Coupon Is Not Apply Because couponQuantity ${coupon.couponQuantity}`;
        req.netAmount = price;
        req.orderTotal = Math.ceil(total);
        req.success = false;
        req.taxAmount = totalPrice;
        req.taxPercentage = a.some((e) => e == false) ? null : taxCheck;
        req.Cart = Cart;
        next();
      } else {
        let a = [];
        for (let t = 0; t < Cart.length; t++) {
          if (coupon?.categoryId?.includes(Cart[t].productId.categoryId)) {
            a.push(t);
          }
        }
        if (a.length > 0) {
          let discount = (total * coupon.couponPercent) / 100;
          if (discount > coupon.maxDiscountPrice) {
            req.message = "Coupon Applied";
            req.success = true;
            req.couponDiscount = coupon.maxDiscountPrice;
            req.netAmount = price;
            req.orderTotal = Math.ceil(total - req.couponDiscount);
            // req.taxId = tax._id;
            req.taxAmount = totalPrice;
            req.taxPercentage = a.some((e) => e == false) ? null : taxCheck;
            req.couponCode = coupon.couponCode;
            req.totalOfferDiscount = req.couponDiscount;
            req.Cart = Cart;
            next();
          }
          if (discount < coupon.maxDiscountPrice) {
            req.message = "Coupon Applied";
            req.couponDiscount = discount;
            req.netAmount = price;
            req.success = true;
            req.orderTotal = Math.ceil(total - req.couponDiscount);
            // req.taxId = tax._id;
            req.taxAmount = totalPrice;
            req.taxPercentage = a.some((e) => e == false) ? null : taxCheck;
            req.couponCode = coupon.couponCode;
            req.totalOfferDiscount = req.couponDiscount;
            req.Cart = Cart;
            next();
          }
        }
        // console.log(a)
        if (a.length == 0) {
          // console.log("KKKKk")
          req.message = "Coupon Not Applied";
          req.netAmount = price;
          req.orderTotal = Math.ceil(total);
          req.success = false;
          req.taxAmount = totalPrice;
          req.taxPercentage = a.some((e) => e == false) ? null : taxCheck;
          req.Cart = Cart;
          next();
        }
      }
    }
    if (
      req.query.membership == "false" ||
      (!req.query.membership &&
        !User.membership.discountPercent &&
        !req.query.membershipId &&
        !req.query.couponCode)
    ) {
      req.netAmount = price;
      req.orderTotal = Math.ceil(total);
      req.taxAmount = totalPrice;
      req.taxPercentage = a.some((e) => e == false) ? null : taxCheck;
      req.Cart = Cart;
      next();
    }
  }
};

exports.billDetailEcommerce = async (req, res, next) => {
   try {
    const userId = req.params.customerId || req.body.customerId || req.User._id;
    
    const [cart, company] = await Promise.all([
      CartModel.findOne({ customerId: userId })
        .populate({
          path: "items.product",
          select: "title thumnail slug variants warranty returnInDays partnerId categoryId",
          populate: {
            path: "categoryId",
            select: "adminCommission"
          }
        })
        .lean(),
      companyModel.findOne().select("productDeliveryFee minDelAmount defaultTaxPercent").lean()
    ]);

    if (cart) {
      cart.items = cart.items
        .map((item) => {
          const product = item.product;
          if (!product || !product.variants || !item.variant) {
            return null;
          }

          const variant = product.variants.find(
            (v) => v._id.toString() === item.variant.toString()
          );

          if (!variant) {
            return null;
          }

          return {
            ...item,
            product: {
              _id: product._id,
              title: product.title,
              thumnail: product.thumnail,
              slug: product.slug,
              warranty: product.warranty || 0,
              returnInDays: product.returnInDays || 0,
              partnerId: product.partnerId,
            },
            variant,
          };
        })
        .filter((item) => item !== null);
    }
 
    if (!cart || cart.items.length === 0) {
      req.Cart = null;
      req.netAmount = 0;
      req.taxAmount = 0;
      req.orderTotal = 0;
      return next();
    }

    let netAmount = 0;
    let taxAmount = 0;
    let total = 0;
    let orderItems = [];
    const taxPercent = company?.defaultTaxPercent || 6;

    for (const item of cart.items) {
      const itemPrice = item.totalPrice;

      netAmount += itemPrice;
      taxAmount += (itemPrice * taxPercent) / 100;

      const category = item.product.categoryId;
      const commissionPercent = category?.adminCommission || 1; // fallback to 1% if not set
      const commissionAmount = (itemPrice * commissionPercent) / 100;

      orderItems.push({
        productId: item.product._id,
        variantId: item.variant._id,
        price: item.totalPrice,
        quantity: item.quantity,
        warranty: item.product.warranty,
        returnInDays: item.product.returnInDays,
        partnerId: item.product.partnerId,
        taxPercent,
        indexStatus: 1,
        status: "PENDING",
        adminCommission: commissionPercent,
        commissionAmount: Number(commissionAmount.toFixed(2)),
      });
    }

    // netAmount = 350
  
    productDeliveryFee = company?.productDeliveryFee || 0;
    const minDelAmount = company?.minDelAmount || 0;
    const deliveryPartnerFee = netAmount >= minDelAmount ? 0 : productDeliveryFee;
    const platformFee = await calculatePlatformFee(netAmount + taxAmount);

    total = netAmount + taxAmount + deliveryPartnerFee + platformFee;

    let couponDiscount = 0;
    let coupon;
    const couponId = req.body.couponId;
    let couponCode = req.query.couponCode || req.body.couponCode;

    if (couponCode) {
      couponCode = couponCode.toUpperCase();
    }

    if (couponId || couponCode) {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const now = new Date();

      const couponData = await couponModel.aggregate([
        {
          $match: {
            disable: false,
            applyOn: "ECOMMERCE",
            startDate: { $lte: now },
            expiryDate: { $gte: now },
            couponQuantity: { $gt: 0 },
            ...(couponId || couponCode
              ? {
                $or: [
                  ...(couponId ? [{ _id: new mongoose.Types.ObjectId(couponId) }] : []),
                  ...(couponCode ? [{ couponCode }] : [])
                ]
              }
              : {})
          }
        },
        {
          $lookup: {
            from: "couponusageschemas",
            let: { couponId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$couponId", "$$couponId"] },
                      { $eq: ["$userId", userObjectId] }
                    ]
                  }
                }
              },
              { $limit: 1 }
            ],
            as: "userUsage"
          }
        },
        {
          $match: {
            userUsage: { $size: 0 } 
          }
        },
        { $limit: 1 } 
      ]);

      if (!couponData.length) {
        req.message = "Coupon invalid / expired / already used";
      } else {
        coupon = couponData[0];

        if (total < coupon.minOrderPrice) {
          req.message = `Minimum order ₹${coupon.minOrderPrice} required`;
        } else {
          if (coupon.discountType === "PERCENTAGE") {
            let discount = (total * coupon.discountValue) / 100;
            if (coupon.maxDiscountPrice) {
              discount = Math.min(discount, coupon.maxDiscountPrice);
            }
            couponDiscount = discount;
          } else if (coupon.discountType === "FLAT") {
            couponDiscount = coupon.discountValue;
          }

          couponDiscount = Math.min(couponDiscount, total);
          total -= couponDiscount;

          req.couponCode = coupon.couponCode;
          req.couponId = coupon._id;
          req.message = "Coupon applied successfully";
        }
      }
    }

    
    req.Cart = cart;
    req.netAmount = Number(netAmount.toFixed(2));
    req.taxAmount = Number(taxAmount.toFixed(2));
    req.taxPercentage = taxPercent;
    req.deliveryPartnerFee = deliveryPartnerFee;
    req.platformFee = platformFee;
    req.couponDiscount = Number(couponDiscount.toFixed(2));
    req.totalOfferDiscount = req.couponDiscount;
    req.orderTotal = Number(total.toFixed(2));
    req.success = true;

    req.bill = {
      items: orderItems,
      taxAmount: Number(taxAmount.toFixed(2)),
      deliveryPartnerFee,
      platformFee,
      orderTotal: Number(total.toFixed(2)),
      netAmount: Number(netAmount.toFixed(2)),
      couponCode: coupon ? coupon.couponCode : null,
      couponId: coupon ? coupon._id : null,
      couponeDiscount: Number(couponDiscount.toFixed(2)),
      totalOfferDiscount: Number(couponDiscount.toFixed(2)),
    };

    next();
  } catch (error) {
    next(error);
  }
};




exports.dummyBillDetail = async (req, res, next) => {
  let obj = {};
  if (req.params.userId) {
    obj.customerId = req.params.userId;
  }
  let netAmount = 0;
  let membershipDiscount = 0;
  let membershipDiscountPercent = 0;
  let membershipId;
  let orderTotal = 0;
  let taxId;
  let taxPercentage = 0;
  let couponCode;
  let couponDiscount = 0;
  let totalOfferDiscount = 0;
  // console.log(req.params.customerId)
  let Cart = await cartModel
    .find(obj)
    .populate({ path: "items.product", populate: "taxId" });
  // let tax = await taxModel.findOne();
  if (!Cart.length) {
    next();
  } else {
    // console.log(Cart)
    // let taxPercent = a.some((e) => e == false) ? null : taxCheck / 100;
    let totalPrice = 0;
    let total = 0;
    let price = 0;
    let taxCheck;
    let a = [];
    for (let i = 0; i < Cart.length; i++) {
      taxCheck = Cart[0].productId.taxId.taxPercent;
      if (Cart[i].productId.taxId.taxPercent == taxCheck) {
        a.push(true);
      } else {
        a.push(false);
      }
      // console.log(Cart[i].price)
      // console.log(Cart[i].productId.taxId.taxPercent)
      totalPrice += (Cart[i].price * Cart[i].productId.taxId.taxPercent) / 100;
      // console.log(totalPrice)
      price += Cart[i].price;
      total = totalPrice + price;
    }
    req.netAmount = price;
    req.orderTotal = Math.ceil(total);
    req.taxAmount = totalPrice;
    req.taxPercentage = a.some((e) => e == false) ? null : taxCheck;
    req.Cart = Cart;
    next();
  }
};

exports.dummyBillDetails = async (req, res, next) => {
  let obj = {};
  if (req.params.userId) {
    obj.customerId = req.params.userId;
  }
  let netAmount = 0;
  let membershipDiscount = 0;
  let membershipDiscountPercent = 0;
  let membershipId;
  let orderTotal = 0;
  let taxId;
  let taxPercentage = 0;
  let couponCode;
  let couponDiscount = 0;
  let totalOfferDiscount = 0;
  // console.log(req.params.customerId)
  let Cart = await CartModel.find(obj).populate({
    path: "items.product",
    populate: "taxId",
  });
  // let tax = await taxModel.findOne();
  if (!Cart.length) {
    next();
  } else {
    // console.log(Cart)
    // let taxPercent = a.some((e) => e == false) ? null : taxCheck / 100;
    let totalPrice = 0;
    let total = 0;
    let price = 0;
    let taxCheck;
    let a = [];
    for (let i = 0; i < Cart.length; i++) {
      taxCheck = Cart[0].productId.taxId.taxPercent;
      if (Cart[i].productId.taxId.taxPercent == taxCheck) {
        a.push(true);
      } else {
        a.push(false);
      }
      // console.log(Cart[i].price)
      // console.log(Cart[i].productId.taxId.taxPercent)
      totalPrice += (Cart[i].price * Cart[i].productId.taxId.taxPercent) / 100;
      // console.log(totalPrice)
      price += Cart[i].price;
      total = totalPrice + price;
    }
    req.netAmount = price;
    req.orderTotal = Math.ceil(total);
    req.taxAmount = totalPrice;
    req.taxPercentage = a.some((e) => e == false) ? null : taxCheck;
    req.Cart = Cart;
    next();
  }
};
