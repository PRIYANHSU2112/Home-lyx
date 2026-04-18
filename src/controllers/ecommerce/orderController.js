const mongoose = require("mongoose");
const orderModel = require("../../models/ecommerce/orderModel");
const CartModel = require("../../models/ecommerce/CartModel");
const productModel = require("../../models/ecommerce/productModel");
const addressModel = require("../../models/ecommerce/addressModel");
const walletModel = require("../../models/walletModel")
const { invoice } = require("../../midellwares/invoice");
const { cancleInvoice } = require("../../midellwares/cancleInvoice");
const { OrderEcommerce } = require("../../helper/status");
const crypto = require("crypto");
const { razorpay } = require("../../../config/razorpay");
const couponUsed = require("../../models/isUsedCouponModel");
const couponModel = require("../../models/couponModel");
const {
  sendNotificationUserOnStatusUpdate,
  sendNotificationToUserByPartner,
  sendNotificationToPartnersOnOrder,
  sendNotificationProductAccepted,
} = require("../notificationController");
const shippingModel = require("../../models/ecommerce/shippmentCharges");
const {
  sendMailOTP,
  sendOtpFunction,
} = require("../../midellwares/nodemailer");
const { local } = require("../../helper/shipping");
const transactionModel = require("../../models/ecommerce/transactionModel");
const { updateVariantStockAndSold } = require("../../helper/productVariantStock");
const settlementService = require("../../services/settlementService");

const dotenv = require("dotenv");
const { features } = require("process");
dotenv.config();


function checkStatusConsistency(array1, key) {
  if (array1.length === 0) {
    return false;
  }
  const firstStatus = array1[0][key];
  for (let i = 1; i < array1.length; i++) {
    if (array1[i][key] !== firstStatus) {
      return false;
    }
  }
  return true;
}
function changeValueByKey(array1, key, index, newValue, value) {
  if (checkStatusConsistency(array1, key)) {
    for (let i = 0; i < array1.length; i++) {
      // console.log(newValue);
      array1[i][key] = newValue;
      array1[i][index] =
        newValue === "PENDING"
          ? 1
          : newValue === "ORDERED"
            ? 2
            : newValue === "ACCEPTED"
              ? 3
              : newValue === "SHIPPED"
                ? 4
                : newValue === "OUT_OF_DELIVERY"
                  ? 5
                  : newValue === "DELIVERED"
                    ? 6
                    : newValue === "RETURN_REQUEST"
                      ? 7
                      : newValue === "RETURN_REQUEST_APPROVED"
                        ? 8
                        : newValue === "CANCELLED"
                          ? 10
                          : 9;
      value = newValue;
    }
  }
  // if (checkStatusConsistency(array1, key) && newValue == "RETURNED") {
  //   array1 = array1;
  //   value = "RETURNED";
  // }
  if (!checkStatusConsistency(array1, key)) {
    for (let i = 0; i < array1.length; i++) {
      array1[i][index] =
        array1[i].status === "PENDING"
          ? 1
          : array1[i].status === "ORDERED"
            ? 2
            : array1[i].status === "ACCEPTED"
              ? 3
              : array1[i].status === "SHIPPED"
                ? 4
                : array1[i].status === "OUT_OF_DELIVERY"
                  ? 5
                  : array1[i].status === "DELIVERED"
                    ? 6
                    : array1[i].status === "RETURN_REQUEST"
                      ? 7
                      : array1[i].status === "RETURN_REQUEST_APPROVED"
                        ? 8
                        : array1[i].status === "CANCELLED"
                          ? 10
                          : 9;
      value = "MULTI_STATUS";
    }
  }
  return value;
}

// ========================== Get Id =================================== ||

exports.getOrderId = async (req, res, next, id) => {
  try {
    let Order = await orderModel.findById(id).populate({
      path: "product.productId",
    });
    if (!Order) {
      return res.status(404).json({
        success: false,
        message: "Order Not Found",
      });
    } else {
      (req.Order = Order), next();
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};



// ======================== Create Order ======================== ||
exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      customerId,
      addressId,
      // categoryId,
      paymentMethod,
    } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, message: "customerId required" });
    }

    if (!addressId) {
      return res.status(400).json({ success: false, message: "addressId required" });
    }

    if (!["COD", "ONLINE", "WALLET"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod must be COD or ONLINE pr WALLET",
      });
    }

    if (!req.bill || req.bill.items.length === 0) {
      await session.endSession();
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const {
      orderTotal,
      taxAmount,
      netAmount,
      couponCode,
      couponId,
      couponeDiscount,
      totalOfferDiscount,
      items,
    } = req.bill;


    // console.log(req.bill);
    const paymentSessionId = crypto.randomUUID();

    const address = await addressModel.findById(addressId)
      .lean();
    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Invalid address",
      });
    }

    // console.log(paymentMethod)
    if (paymentMethod === "WALLET") {
      const wallet = await walletModel.findOne({ customerId }).session(session);

      if (!wallet || wallet.balance < orderTotal) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }
      wallet.balance -= netAmount;
      await wallet.save({ session });
    }

    const masterOrderIdGenerated = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await orderModel.create([{
      customerId,
      orderTotal,
      taxAmount,
      netAmount,
      couponeCode: couponCode,
      couponeDiscount,
      totalOfferDiscount,
      address,
      product: items,
      status: "PENDING",
      paymentMethod,
      paymentStatus: paymentMethod === "WALLET" ? "PAID" : "UNPAID",
      paymentSessionId,
      orderId: masterOrderIdGenerated
    }], { session });

    const masterOrder = order[0];

    // Group items by partnerId for sub-orders
    const itemsByPartner = items.reduce((acc, item) => {
      const partnerId = item.partnerId ? item.partnerId.toString() : "admin";
      if (!acc[partnerId]) acc[partnerId] = [];
      acc[partnerId].push(item);
      return acc;
    }, {});

    const subOrders = [];
    for (const [partnerId, partnerItems] of Object.entries(itemsByPartner)) {
      if (partnerId === "admin") continue; // Skip if no partnerId (handled by admin/master)

      // Calculate sub-order totals (simple sum of items, without global discounts for now as per "functionality change nahi honi chiye" constraint)
      const subNet = partnerItems.reduce((sum, item) => sum + item.price, 0);
      const subTax = partnerItems.reduce((sum, item) => sum + (item.price * item.taxPercent) / 100, 0);
      const subTotal = subNet + subTax;

      const subOrder = await orderModel.create([{
        customerId,
        orderTotal: subTotal,
        taxAmount: subTax,
        netAmount: subNet,
        address,
        product: partnerItems,
        status: "PENDING",
        paymentMethod,
        paymentStatus: masterOrder.paymentStatus,
        paymentSessionId,
        parentOrderId: masterOrder._id,
        partnerId: partnerId,
        orderId: `SUB-${masterOrderIdGenerated}-${partnerId.slice(-4)}`
      }], { session });
      subOrders.push(subOrder[0]);
    }

    // Only create coupon usage if couponId exists
    if (couponId) {
      const usedCoupon = await couponUsed.insertMany([{
        couponId: couponId,
        userId: customerId,
        couponCode: couponCode
      }], { session })
      // console.log(usedCoupon);

      await couponModel.updateOne({
        _id: couponId,
        couponQuantity: { $gt: 0 }
      }, { $inc: { couponQuantity: -1 } }, { session });
    }

    let razorpayOrder = null;

    if (paymentMethod === "ONLINE") {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(orderTotal * 100),
        currency: "INR",
        receipt: `order_${masterOrder._id}`
      })
    }

    // Create Transation

    const transaction = await transactionModel.create([{
      customerId: customerId,
      orderId: masterOrder._id,
      razorpayOrderId: razorpayOrder?.id || null,
      amount: orderTotal,
      paymentMethod,
      status: "CREATED",
      walletType: paymentMethod === "WALLET" ? "DEBIT" : null,
      walletPurpose: paymentMethod === "WALLET" ? "ORDER_PAYMENT" : null,
      paymentSessionId
    }], { session })

    // Create separate transactions for each sub-order
    for (const subOrder of subOrders) {
      const subTransaction = await transactionModel.create([{
        customerId: customerId,
        orderId: subOrder._id,
        razorpayOrderId: razorpayOrder?.id || null,
        amount: subOrder.orderTotal,
        paymentMethod,
        status: "CREATED",
        walletType: paymentMethod === "WALLET" ? "DEBIT" : null,
        walletPurpose: paymentMethod === "WALLET" ? "ORDER_PAYMENT" : null,
        paymentSessionId
      }], { session });

      // Update sub-order with its specific transactionId
      await orderModel.findByIdAndUpdate(
        subOrder._id,
        { transactionId: subTransaction[0]._id },
        { session }
      );
    }


    if (paymentMethod === "COD" || paymentMethod === "WALLET") {

      for (const item of items) {

        const updatedProduct = await productModel.findOneAndUpdate(
          {
            _id: item.productId,
            "variants._id": item.variantId,
            "variants.stock": { $gte: item.quantity } // safety check
          },
          {
            $inc: {
              // VARIANT LEVEL
              "variants.$.stock": -item.quantity,
              "variants.$.sold": item.quantity,
              // product level
              sold: item.quantity
            }
          },
          {
            session,
            new: true
          }
        );

        if (!updatedProduct) {
          throw new Error("STOCK_UNAVAILABLE");
        }
      }
      //  let code = await invoice(order[0]);
      await orderModel.findByIdAndUpdate(
        masterOrder._id,
        {
          transactionId: transaction[0]._id,
        },
        { new: true, session }
      );

      // // Update transactionId for sub-orders too
      // await orderModel.updateMany(
      //   { parentOrderId: masterOrder._id },
      //   { transactionId: transaction[0]._id },
      //   { session }
      // );

      await CartModel.deleteOne({ customerId });
    }

    await session.commitTransaction();
    session.endSession();

    const allowedPaymentMethods = ["COD", "WALLET"];

    if (allowedPaymentMethods.includes(paymentMethod)) {
      Promise.all([
        sendNotificationToUserByPartner(masterOrder, masterOrder.status, "ADMIN"),
        sendNotificationToPartnersOnOrder(masterOrder)
      ]);
    }

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: masterOrder,
      subOrders: subOrders,
      razorpayOrderId: razorpayOrder?.id || null,
      key: paymentMethod === "ONLINE" ? process.env.RAZORPAY_KEY_ID : null
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({
      success: false,
      message: error.message,
    });
    console.log(error.stack);
  }
};


exports.verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();

  console.log(req.body);
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;
    // console.log(req.body);
    // console.log(razorpay_signature)
    const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');


    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature"
      })
    }

    // Search by razorpayOrderId. This represents the checkout session.
    // We only need to find one record to verify the payment exists in our records.
    const transaction = await transactionModel.findOne({ razorpayOrderId: razorpay_order_id });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      })
    }

    const order = await orderModel.findById(orderId).populate("customerId");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus === "PAID" && transaction.status === "SUCCESS") {
      return res.status(200).json({ success: true, message: "Payment already verified" });
    }

    transaction.razorpayPaymentId ??= razorpay_payment_id;
    transaction.razorpaySignature ??= razorpay_signature;
    transaction.status = "SUCCESS";
    await transaction.save({ session });


    const masterOrderId = order.parentOrderId || order._id;

    await orderModel.updateMany(
      {
        $or: [
          { _id: masterOrderId },
          { parentOrderId: masterOrderId }
        ]
      },
      {
        paymentStatus: "PAID",
        status: "PENDING",
        transactionId: transaction._id,
        transactionRef: razorpay_order_id
      },
      { session }
    );

    // Sync all related sub-transactions in transactionModel
    await transactionModel.updateMany(
      { razorpayOrderId: razorpay_order_id, status: "CREATED" },
      {
        status: "SUCCESS",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      },
      { session }
    );

     await CartModel.deleteOne({ customerId: order.customerId });

    //  STOCK UPDATE + REFUND SAFETY

    // console.log(order.product)

    session.startTransaction();

    try {
      for (const item of order.product) {
        const updatedProduct = await productModel.findOneAndUpdate(
          { _id: item.productId },
          {
            $inc: {
              "variants.$[v].stock": -item.quantity,
              "variants.$[v].sold": item.quantity,
              sold: item.quantity,
            },
          },
          {
            arrayFilters: [
              {
                "v._id": new mongoose.Types.ObjectId(item.variantId),
                "v.stock": { $gte: item.quantity },
              },
            ],
            session,
            new: true,
          }
        );

        if (!updatedProduct) {
          throw new Error("STOCK_UNAVAILABLE");
        }
      }

      //  Commit stock updates
      await session.commitTransaction();
      session.endSession();

      Promise.all([
        sendNotificationToUserByPartner(order, order.status, "ADMIN"),
        sendNotificationToPartnersOnOrder(order)
      ]);

      return res.status(200).json({
        success: true,
        message: "Payment verified & stock updated successfully",
      });

    } catch (error) {

      await session.abortTransaction();
      session.endSession();

      //  Refund only if payment was done
      if (transaction.status === "SUCCESS") {
        await razorpay.payments.refund(razorpay_payment_id, {
          amount: transaction.amount * 100
        });

        transaction.status = "REFUNDED";
        await transaction.save();
      }

      order.paymentStatus = "FAILED";
      order.paymentFailedReason = "Stock unavailable – refund issued";
      await order.save();

      res.status(400).json({
        success: false,
        message: `Stock unavailable – refund issued + ${error.stack}`
      });
      // console.error(error.stack)

    }

    // const  code = await invoice(order);
    // order.invoice = `HomelyxOrder/${code}.pdf`;

    // await orderModel.save();

    // await sendNotificationToUserByPartner(order, order.status, "ADMIN");

    // return res.status(200).json({
    //   success: true,
    //   message: "Payment verified & stock updated successfully",
    // });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
}


// ================= updateSingleStatus ===============//
exports.updateSingleStatus = async (req, res) => {
  try {
    //     console.log("REQ.ORDER =>", req.Order);
    // console.log("REQ.BODY =>", req.body);

    let status = req.body.status;

    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "Status Is Required..." });
    }

    if (!Object.values(OrderEcommerce).includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "(PENDING || ORDERED || MULTI_STATUS || SHIPPED || RETURN_REQUEST_APPROVED || DELIVERED || CANCELLED || RETURN_REQUEST || OUT_OF_DELIVERY || RETURNED) This Is Valied Status",
      });
    }
    if (!req.query.productId) {
      return res.status(400).json({
        success: false,
        message: "productId Is Required...",
      });
    }
    let statusUpdate;
    if (status == "RETURNED") {
      if (!req.query.productId) {
        return res.status(400).json({
          success: false,
          message: "productId Is Required",
        });
      }
      statusUpdate = await orderModel.findOneAndUpdate(
        {
          _id: req.Order._id,
          "product.productId": req.query.productId,
        },
        { $set: { "product.$.status": req.body.status } },
        { new: true }
      );

      let a = await productModel.findById({
        _id: req.query.productId,
      });

      let data = statusUpdate.product.find((o) => {
        return o.productId == req.query.productId;
      });
      await productModel.findByIdAndUpdate(
        { _id: req.query.productId },
        {
          $set: {
            stock: a.stock + data.quantity,
            sold: a.sold - data.quantity,
          },
        },
        { new: true }
      );
    } else {
      let find = await orderModel.findOne({
        _id: req.Order._id,
        "product.productId": req.query.productId,
      });
      // console.log("find" + find);
      let check = true;
      // for (let i = 0; i < find.product.length; i++) {
      //   if (
      //     find.product[i].productId == req.query.productId &&
      //     find.product[i].status == "RETURN_REQUEST"
      //   ) {
      //     check = true;
      //   }
      // }
      // console.log(req.Order.product)      
      if (check && req.body.status == "CANCELLED") {
        await updateVariantStockAndSold(
          req.Order.product,
          +1,
          -1
        );
        statusUpdate = await orderModel.findOneAndUpdate(
          {
            _id: req.Order._id,
            "product.productId": req.query.productId,
          },
          { $set: { "product.$.status": "CANCELLED" } },
          { new: true }
        );
      } else {
        statusUpdate = await orderModel.findOneAndUpdate(
          {
            _id: req.Order._id,
            "product.productId": req.query.productId,
          },
          { $set: { "product.$.status": req.body.status } },
          { new: true }
        );
      }
    }
    let array1 = statusUpdate.product;
    // console.log(array1)
    let value = "SINGLE";
    value = changeValueByKey(
      array1,
      "status",
      "indexStatus",
      req.body.status,
      value
    );
    //if (value == "RETURNED") {
    // array1 = [];
    //}
    statusUpdate = await orderModel.findOneAndUpdate(
      {
        _id: req.Order._id,
      },
      { $set: { product: array1, status: value } },
      { new: true }
    );

    const targetStatus = req.body.status;
    const isMaster = !statusUpdate.parentOrderId;

    if (["CANCELLED", "DELIVERED", "SHIPPED", "RETURNED"].includes(targetStatus)) {
      if (isMaster) {
        // Refined Sync to ALL Sub-Orders that contain this product
        const affectedSubOrders = await orderModel.find({
          parentOrderId: req.Order._id,
          "product.productId": req.query.productId
        });

        for (let sub of affectedSubOrders) {
          sub.product.forEach(p => {
            if (p.productId.toString() === req.query.productId.toString()) {
              p.status = targetStatus;
            }
          });

          // Correct Overall Status Calculation for Sub-Order
          const subStatuses = sub.product.map(p => p.status);
          const uniqueSubStatuses = [...new Set(subStatuses)];
          sub.status = uniqueSubStatuses.length === 1 ? uniqueSubStatuses[0] : "MULTI_STATUS";

          await sub.save();
        }
      } else {
        // Sync back to Master Order
        const masterOrder = await orderModel.findById(statusUpdate.parentOrderId);
        if (masterOrder) {
          masterOrder.product.forEach(p => {
            if (p.productId.toString() === req.query.productId.toString()) {
              p.status = targetStatus;
            }
          });
          // Recalculate Master Status
          const masterStatuses = masterOrder.product.map(p => p.status);
          const uniqueMasterStatuses = [...new Set(masterStatuses)];
          masterOrder.status = uniqueMasterStatuses.length === 1 ? uniqueMasterStatuses[0] : "MULTI_STATUS";
          await masterOrder.save();
        }
      }
    }

    await sendNotificationUserOnStatusUpdate(statusUpdate, status);
    return res.status(200).json({
      success: true,
      message: "Status Is Update Successfully...",
      data: statusUpdate,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================== Update All status ===================== ||

exports.updateAllProductStatus = async (req, res) => {
  try {
    const status = req.body.status;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status Is Required",
      });
    }

    if (!Object.values(OrderEcommerce).includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // console.log("order " + req.Order.product)

    // const updatedProducts = req.Order.product.map(p => ({
    //   ...p,
    //   status: status,
    // }));


    if (
      status === OrderEcommerce.CANCELLED && req.Order.status !== OrderEcommerce.CANCELLED
    ) {
      await updateVariantStockAndSold(
        req.Order.product,
        +1, // stock increase
        -1  // sold decrease
      );
    }


    const statusUpdate = await orderModel.findByIdAndUpdate(
      req.Order._id,
      {
        $set: {
          status: status,
          "product.$[].status": status,
        },
      },
      { new: true }
    ).populate("customerId");

    // Sync between Master and Sub-Orders
    const isMaster = !statusUpdate.parentOrderId;
    if (["CANCELLED", "DELIVERED", "SHIPPED", "RETURNED"].includes(status)) {
      if (isMaster) {
        // Master -> Subs: All sub-orders for this master must be updated
        await orderModel.updateMany(
          { parentOrderId: req.Order._id },
          {
            $set: {
              status: status,
              "product.$[].status": status
            }
          }
        );
      } else {
        // Sub -> Master: Products in the master matching this sub-order must be updated
        const masterOrder = await orderModel.findById(statusUpdate.parentOrderId);
        if (masterOrder) {
          masterOrder.product.forEach(p => {
            const isItemInSub = statusUpdate.product.some(sp => sp.productId.toString() === p.productId.toString());
            if (isItemInSub) {
              p.status = status;
            }
          });
          // Recalculate Master Status
          const masterStatuses = masterOrder.product.map(p => p.status);
          const uniqueMasterStatuses = [...new Set(masterStatuses)];
          masterOrder.status = uniqueMasterStatuses.length === 1 ? uniqueMasterStatuses[0] : "MULTI_STATUS";
          await masterOrder.save();
        }
      }
    }

    if (status === OrderEcommerce.DELIVERED) {
      // Settle commission for each product with partnerId
      console.log("Settling commissions for delivered order:", req.Order.product);
      if (req.Order.product && req.Order.product.length > 0) {
        for (let i = 0; i < req.Order.product.length; i++) {
          // console.log(`Processing product ${req.Order.product[i]}`);
          const product = req.Order.product[i];
          console.log(`Checking product ${product.productId?.partnerId} for partner settlement...`);
          if (product.productId?.partnerId) {
            console.log(`Settling commission for product ${product.productId._id} with partner ${product.productId.partnerId}`);
            await settlementService.settleOrderCommission(req.Order._id, i);
          }
        }
      }

      // Generate invoice
      const code = await invoice(req.Order);
      await orderModel.findByIdAndUpdate(
        req.Order._id,
        {
          $set: {
            invoice: `home-lyx/${code}.pdf`,
          },
        },
        { new: true }
      );
    }

    sendNotificationUserOnStatusUpdate(statusUpdate, status);

    return res.status(200).json({
      success: true,
      message: "Status Updated Successfully",
      data: statusUpdate,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= updateTransitionId ===================
exports.updateTransitionId = async (req, res) => {
  try {
    if (!req.body.transactionId) {
      return res.status(400).json({
        success: false,
        message: "transactionId Is Required",
      });
    }
    let array1 = req.Order.product;
    let value = "SINGLE";
    value = changeValueByKey(
      array1,
      "status",
      "indexStatus",
      OrderEcommerce.ORDERED,
      value
    );
    // for (let i = 0; i < array1.length; i++) {
    //   console.log(array1[i].productId);
    //   let a = await productModel.findById({ _id: array1[i].productId._id });
    //   await productModel.findByIdAndUpdate(
    //     { _id: array1[i].productId._id },
    //     {
    //       $set: {
    //         stock: a.stock - Cart[i].quantity,
    //         sold: a.sold + Cart[i].quantity,
    //       },
    //     },
    //     { new: true }
    //   );
    // }

    let code = await invoice(req.Order);
    const updtetrans = await orderModel.findOneAndUpdate(
      { _id: req.Order._id },
      {
        $set: {
          transactionId: req.body.transactionId,
          product: array1,
          status: value,
          invoice: `HomeService/${code}.pdf`,
          paymentStatus: "PAID",
        },
      },
      { new: true }
    );

    return res.status(200).send({
      success: true,
      message: "TransactionId Update Successfully",
      data: updtetrans,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// ======================  getOrderByCustomerId ===================== ||
exports.getOrderByCustomerId = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const baseQuery = { customerId: req.User._id, parentOrderId: null };

    const result = await orderModel.aggregate([
      // Match customer orders
      { $match: baseQuery },

      // Join products and customer
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "ecommerceproductmodels",
          localField: "product.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "usermodels",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },

      // Search filter (if provided)
      ...(search ? [{
        $match: {
          $or: [
            { status: { $regex: search, $options: "i" } },
            { orderId: { $regex: search, $options: "i" } },
            { "productDetails.title": { $regex: search, $options: "i" } },
            { "productDetails.brandName": { $regex: search, $options: "i" } },
            { "customer.name": { $regex: search, $options: "i" } },
            { "customer.email": { $regex: search, $options: "i" } },
          ],
        },
      }] : []),

      // Group back products
      {
        $group: {
          _id: "$_id",
          orderTotal: { $first: "$orderTotal" },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" },
          address: { $first: "$address" },
          taxAmount: { $first: "$taxAmount" },
          paymentStatus: { $first: "$paymentStatus" },
          netAmount: { $first: "$netAmount" },
          transactionId: { $first: "$transactionId" },
          transactionRef: { $first: "$transactionRef" },
          cancleBy: { $first: "$cancleBy" },
          reason: { $first: "$reason" },
          customer: { $first: "$customer" },
          products: {
            $push: {
              productId: "$product.productId",
              variantId: "$product.variantId",
              quantity: "$product.quantity",
              price: "$product.price",
              title: "$productDetails.title",
              brandName: "$productDetails.brandName",
              thumnail: "$productDetails.thumnail",
              features: "$productDetails.features",
              size: {
                $let: {
                  vars: {
                    selectedVariant: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$productDetails.variants",
                            as: "v",
                            cond: { $eq: ["$$v._id", "$product.variantId"] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: "$$selectedVariant.size"
                }
              }
            }
          }
        }
      },

      {
        $addFields: {
          productCount: { $size: "$products" }, // Number of unique products
        },
      },
      // Sort
      { $sort: { createdAt: -1 } },

      // Facet for count + pagination
      {
        $facet: {
          totalOrders: [{ $count: "count" }],
          orders: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                orderId: 1,
                orderTotal: 1,
                status: 1,
                createdAt: 1,
                taxAmount: 1,
                paymentStatus: 1,
                netAmount: 1,
                transactionId: 1,
                transactionRef: 1,
                cancleBy: 1,
                reason: 1,
                products: 1,
                productCount: 1,
                address: 1,
                customer: {
                  _id: 1,
                  name: 1,
                  email: 1,
                  fullName: 1,
                  phoneNumber: 1,
                  userType: 1,
                  permissions: 1,
                  gender: 1,
                  image: 1,
                },
              },
            },
          ],
        },
      },

      {
        $project: {
          totalOrders: {
            $ifNull: [{ $arrayElemAt: ["$totalOrders.count", 0] }, 0],
          },
          orders: 1,
        },
      },
    ]);

    const totalOrders = result[0]?.totalOrders || 0;
    const orders = result[0]?.orders || [];
    const totalPages = Math.ceil(totalOrders / limit);

    return res.status(200).send({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// ============== getByOrderId ==================
exports.getByOrderId = async (req, res) => {
  try {
    let orderDetails = await orderModel
      .findById(req.Order._id)
      .select(
        "-_id orderTotal taxAmount totalOfferDiscount status netAmount  workingOtp completedOtp couponeCode couponeDiscount memberDiscount memberDiscountPercent"
      );
    let order = await orderModel
      .findById(req.Order._id)
      .select(
        "-orderTotal -taxAmount -totalOfferDiscount -status -netAmount  -workingOtp -completedOtp -couponeCode -couponeDiscount -memberDiscount -memberDiscountPercent"
      )
      .populate({
        path: "product.productId",
      })
      .populate("customerId");
    order._doc.orderDetails = orderDetails;
    return res.status(200).send({
      success: true,
      message: "Order Fatch Successfully...",
      data: order,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ================= Cancle =================
exports.cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reason } = req.body;
    if (!reason) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Cancellation reason is required" });
    }

    const blockedStatuses = [
      OrderEcommerce.SHIPPED,
      OrderEcommerce.OUT_OF_DELIVERY,
      OrderEcommerce.DELIVERED,
      OrderEcommerce.CANCELLED,
    ];

    if (blockedStatuses.includes(req.Order.status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled as it is already ${req.Order.status}`
      });
    }

    const isMaster = !req.Order.parentOrderId;
    const orderId = req.Order._id;

    // 1. Update Current Order
    let products = req.Order.product;
    products.forEach(p => { p.status = OrderEcommerce.CANCELLED; });

    // Handle Stock Return
    for (const item of products) {
      const product = await productModel.findById(item.productId).session(session);
      if (product) {
        await productModel.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity, sold: -item.quantity } },
          { session }
        );
      }
    }

    const cancelledOrder = await orderModel.findByIdAndUpdate(
      orderId,
      {
        $set: {
          status: OrderEcommerce.CANCELLED,
          cancleBy: "CUSTOMER", // Or determine based on auth
          product: products,
          reason: reason,
        },
      },
      { new: true, session }
    );

    // 2. Cascade / Sync Logic
    if (isMaster) {
      // Scenario: Master Cancelled -> Cancel all Sub-Orders
      const subOrders = await orderModel.find({ parentOrderId: orderId }).session(session);
      for (const sub of subOrders) {
        if (sub.status !== OrderEcommerce.CANCELLED) {
          sub.status = OrderEcommerce.CANCELLED;
          sub.product.forEach(p => { p.status = OrderEcommerce.CANCELLED; });
          await sub.save({ session });
        }
      }
    } else {
      // Scenario: Sub-Order Cancelled -> Sync Master Order Items
      const masterOrder = await orderModel.findById(req.Order.parentOrderId).session(session);
      if (masterOrder) {
        masterOrder.product.forEach(item => {
          const isItemInThisSub = products.some(sp => sp.productId.toString() === item.productId.toString());
          if (isItemInThisSub) {
            item.status = OrderEcommerce.CANCELLED;
          }
        });

        // Recalculate Master Status
        const statuses = masterOrder.product.map(p => p.status);
        const uniqueStatuses = [...new Set(statuses)];
        if (uniqueStatuses.length === 1) {
          masterOrder.status = uniqueStatuses[0];
        } else {
          masterOrder.status = "MULTI_STATUS";
        }
        await masterOrder.save({ session });
      }
    }

    // 3. Refund Logic (Wallet/Online/Paid)
    if (["WALLET", "ONLINE"].includes(cancelledOrder.paymentMethod) && cancelledOrder.paymentStatus === "PAID") {
      const refundAmount = cancelledOrder.orderTotal;

      await walletModel.findOneAndUpdate(
        { customerId: cancelledOrder.customerId },
        { $inc: { balance: refundAmount } },
        { upsert: true, session }
      );

      await transactionModel.create(
        [{
          orderId: cancelledOrder._id,
          customerId: cancelledOrder.customerId,
          amount: refundAmount,
          paymentMethod: "WALLET",
          walletType: "CREDIT",
          walletPurpose: "REFUND",
          status: "REFUNDED",
        }],
        { session }
      );

      const code = await cancleInvoice(cancelledOrder);
      await orderModel.findByIdAndUpdate(
        cancelledOrder._id,
        { $set: { paymentStatus: "REFUNDED", invoice: `home-lyx/${code}.pdf` } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).send({
      success: true,
      message: "Order items cancelled successfully and relevant orders synced.",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Cancellation Error:", error);
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ================= return RequestOrder =================
exports.returnRequestOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const { productId, variantId } = req.query;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "reason is required",
      });
    }

    if (!productId || !variantId) {
      return res.status(400).json({
        success: false,
        message: "productId and variantId are required",
      });
    }

    const order = req.Order;
    let targetItem = null;

    for (const item of order.product) {
      if (
        item.productId._id.toString() === productId.toString() &&
        item.variantId.toString() === variantId.toString()
      ) {
        targetItem = item;
        break;
      }
    }

    if (!targetItem) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found in order",
      });
    }

    if (["RETURN_REQUEST", "RETURNED"].includes(targetItem.status)) {
      return res.status(400).json({
        success: false,
        message: "Return already initiated for this item",
      });
    }

    if (targetItem.returnInDays === 0) {
      return res.status(400).json({
        success: false,
        message: "Return not allowed for this product",
      });
    }

    const rawDeliveredDate = order.deliveredDate || order.updatedAt;
    
    const deliveredDate = new Date(rawDeliveredDate);
    deliveredDate.setHours(23, 59, 59, 999);
    deliveredDate.setDate(
      deliveredDate.getDate() + targetItem.returnInDays - 1
    );

    if (new Date() > deliveredDate) {
      return res.status(400).json({
        success: false,
        message: "Return window expired",
      });
    }

    const updatedOrder = await orderModel.findOneAndUpdate(
      { _id: order._id },
      {
        $set: {
          "product.$[item].status": "RETURN_REQUEST",
          reason,
        },
      },
      {
        arrayFilters: [
          {
            "item.productId": productId,
            "item.variantId": variantId,
          },
        ],
        new: true,
      }
    );

    const statuses = updatedOrder.product.map(p => p.status);

    let orderStatus = "MULTI_STATUS";

    if (statuses.every(s => s === "RETURN_REQUEST")) {
      orderStatus = "RETURN_REQUEST";
    }

    // if (statuses.every(s => s === "RETURN_REQUEST_APPROVED")) {
    //   orderStatus = "RETURN_REQUEST_APPROVED";
    // }

    if (statuses.every(s => s === "RETURNED")) {
      orderStatus = "RETURNED";
    }
    //  RETURN_REQUEST_APPROVED
    updatedOrder.status = orderStatus;
    await updatedOrder.save();

    return res.status(200).json({
      success: true,
      message: "Return request submitted successfully",
      data: updatedOrder,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllOrdersForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    let searchFilter = { parentOrderId: null };

    if (search) {
      const customerIds = await mongoose
        .model("User")
        .find({
          $or: [
            { fullName: { $regex: search, $options: "i" } },
            { name: { $regex: search, $options: "i" } },
            { mobile: { $regex: search, $options: "i" } },
          ],
        })
        .distinct("_id");

      searchFilter = {
        parentOrderId: null,
        $or: [
          { orderId: { $regex: search, $options: "i" } },
          { customerId: { $in: customerIds } },
        ],
      };
    }

    const [totalOrders, masterOrders] = await Promise.all([
      orderModel.countDocuments(searchFilter),
      orderModel
        .find(searchFilter)
        .populate("customerId", "fullName name mobile email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    const subOrders = await orderModel
      .find({ parentOrderId: { $in: masterOrders.map((o) => o._id) } })
      .populate("partnerId", "name email mobile businessName")
      .populate("product.productId", "title thumnail images slug");

    // Group sub-orders by parentOrderId for O(n) lookup
    const subOrderMap = subOrders.reduce((map, sub) => {
      const key = sub.parentOrderId.toString();
      (map[key] ??= []).push(sub);
      return map;
    }, {});

    const ordersWithSubs = masterOrders.map((master) => ({
      ...master._doc,
      subOrders: subOrderMap[master._id.toString()] ?? [],
    }));

    return res.status(200).json({
      success: true,
      data: ordersWithSubs,
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


exports.filterOrderByDate = async (req, res) => {
  try {
    const { status, filter, paymentMethod } = req.query;
    let obj = {};
    let obj2 = {};
    let turnOver = 0;
    let pendingCount = 0;
    let outOfDeliveryCount = 0;
    let orderedCount = 0;
    let deliveredCount = 0;
    let returnRequestCount = 0;
    let returnedCount = 0;
    let returnRequestApprovedCount = 0;
    let shippedCount = 0;
    let multiStatusCount = 0;
    let cancelCount = 0;
    if (req.filterQuery) {
      obj.createdAt = req.filterQuery;
    }
    if (status) {
      if (!Object.values(OrderEcommerce).includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "(PENDING || ORDERED || MULTI_STATUS || SHIPPED || RETURN_REQUEST_APPROVED || DELIVERED || CANCELLED || RETURN_REQUEST || OUT_OF_DELIVERY || RETURNED) This Is Valied Status",
        });
      } else {
        obj.status = status;
      }
    }
    if (paymentMethod) {
      obj.paymentMethod = paymentMethod;
    }
    if (req.query.price) {
      // console.log(req.query.price);
      if (
        req.query.price !== "low_to_high" &&
        req.query.price !== "high_to_low"
      ) {
        return res.status(400).json({
          success: false,
          message: "'low_to_high', 'high_to_low' are the valid price options.",
        });
      } else {
        if (req.query.price === "low_to_high") {
          obj2.orderTotal = 1;
        } else if (req.query.price === "high_to_low") {
          obj2.orderTotal = -1;
        }
      }
    }
    obj2.createdAt = -1;
    let getData = await orderModel.find(obj).sort(obj2).populate({
      path: "customerId",
      select: "fullName",
    })
      .populate({
        path: "product.productId",
        select: "title",
      })
    let datas = "";
    function applyFilters(getData) {
      const search = req.query.search;
      let filteredData = getData.filter((e) => {
        let check = false;
        if (search && search.length == 24) {
          if (e?._id == search) {
            check = true;
            return e?._id == search;
          }
        } else if (!check) {
          return (
            !search || new RegExp(search, "i").test(e.customerId?.fullName)
          );
        }
      });

      filteredData.forEach((f) => {
        if (f.status === "PENDING") {
          pendingCount++;
        } else if (f.status === "ORDERED") {
          orderedCount++;
        } else if (f.status === "OUT_OF_DELIVERY") {
          outOfDeliveryCount++;
        } else if (f.status === "DELIVERED") {
          deliveredCount++;
        } else if (f.status === "RETURN_REQUEST") {
          returnRequestCount++;
        } else if (f.status === "RETURNED") {
          returnedCount++;
        } else if (f.status === "CANCELLED") {
          cancelCount++;
        } else if (f.status === "RETURN_REQUEST_APPROVED") {
          returnRequestApprovedCount++;
        } else if (f.status === "SHIPPED") {
          shippedCount++;
        } else if (f.status === "MULTI_STATUS") {
          multiStatusCount++;
        }

        if (f.orderTotal) {
          turnOver += f.orderTotal;
        }
      });

      return {
        filteredData,
        pendingCount,
        outOfDeliveryCount,
        orderedCount,
        deliveredCount,
        returnRequestCount,
        returnedCount,
        returnRequestApprovedCount,
        shippedCount,
        multiStatusCount,
        cancelCount,
        turnOver,
      };
    }

    const result = applyFilters(getData);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const length = result.filteredData.length;
    const totalPages = Math.ceil(length / limit);
    const data = result.filteredData.slice(startIndex, endIndex);
    return res.status(200).json({
      success: true,
      message: "Order Is Filter Successfully...",
      data: datas ? datas : data,
      stats: {
        turnOver: turnOver,
        pendingCount: pendingCount,
        outOfDeliveryCount: outOfDeliveryCount,
        orderedCount: orderedCount,
        deliveredCount: deliveredCount,
        returnRequestCount: returnRequestCount,
        returnedCount: returnedCount,
        returnRequestApprovedCount: returnRequestApprovedCount,
        shippedCount: shippedCount,
        multiStatusCount: multiStatusCount,
        cancelCount: cancelCount,
      },
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalRecords: length,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updatePartnerOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const subOrder = await orderModel.findById(orderId);
    if (!subOrder) {
      return res.status(404).json({ success: false, message: "Sub-order not found" });
    }

    // Security Check: Only the partner who owns this sub-order can update it
    if (subOrder.partnerId.toString() !== req.partnerProfile._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized: This is not your order" });
    }

    // 1. Update Sub-Order Status
    subOrder.status = status;
    subOrder.product.forEach(p => {
      p.status = status;
    });
    await subOrder.save();

    // 2. Sync with Master Order (Parent)
    if (subOrder.parentOrderId) {
      const masterOrder = await orderModel.findById(subOrder.parentOrderId);
      if (masterOrder) {
        // Update items in master order that belong to this partner
        masterOrder.product.forEach(item => {
          // Check if this item is in the current sub-order
          const isItemInSubOrder = subOrder.product.some(sp => sp.productId.toString() === item.productId.toString());
          if (isItemInSubOrder) {
            item.status = status;
          }
        });

        // Recalculate Master Order Status Overall
        const itemStatuses = masterOrder.product.map(p => p.status);
        const uniqueStatuses = [...new Set(itemStatuses)];
        masterOrder.status = uniqueStatuses.length === 1 ? uniqueStatuses[0] : "MULTI_STATUS";

        await masterOrder.save();
      }
    }
    
    if (status === "ACCEPTED") {
      const populatedOrder = await orderModel.findById(orderId).populate("product.productId", "title");
      const productTitles = populatedOrder.product.map(p => p.productId?.title).filter(Boolean).join(", ");
      
      await sendNotificationProductAccepted({
        userId: subOrder.customerId,
        orderId: subOrder._id,
        productTitle: productTitles
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated and synced successfully",
      data: subOrder
    });

  } catch (error) {
    console.error("Partner status update error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrdersByPartner = async (req, res) => {
  try {
    const partnerId = req.partnerProfile._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { status, paymentStatus } = req.query;

    const filter = { partnerId };

    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    const [count, orders] = await Promise.all([
      orderModel.countDocuments(filter),
      orderModel
        .find(filter)
        .populate("product.productId", "title thumnail images features ")
        .populate("product.variantId", "size color price")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalOrders: count,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderDetailByPartner = async (req, res) => {
  try {
    const order = await orderModel
      .findOne({ _id: req.params.orderId, partnerId: req.partnerProfile._id })
      .populate("product.productId", "title thumnail images slug");

    return res.status(order ? 200 : 404).json(
      order
        ? { success: true, data: order }
        : { success: false, message: "Order not found or access denied" }
    );
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};