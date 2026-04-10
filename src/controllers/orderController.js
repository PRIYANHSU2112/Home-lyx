const orderModel = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const addressModel = require("../models/ecommerce/addressModel");
const otpGenerator = require("otp-generator");
const userModel = require("../models/userModel");
const partnerProfileModel = require("../models/partnerProfileModel");
const notificationModel = require("../models/notificationModel");
const { userPermissions } = require("../helper/userPermission");
const { userType } = require("../helper/userType");
const { invoice } = require("../midellwares/invoice");
const { OrderService } = require("../helper/status");
const { local } = require("../helper/shipping");

const {
  sendNotificationCreateSurviceAdminAndSubAdmin,
  sendNotificationCancleStatusByAdmin,
  sendNotificationSurviceAdminAndSubAdmin,
  sendNotificationToUserByPartner,
  sendNotificationToPartnerByAdmin,
} = require("./notificationController");
let a = 2;
const { sendMailOTP, sendOtpFunction } = require("../midellwares/nodemailer");
const productModel = require("../models/productModel");
function validateMobileNumber(number) {
  const regex = /^[0-9]{10}$/;
  return regex.test(number);
}

// ===================== Otp Generator ====================== ||

const otp = () => {
  let o = Number(
    otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    })
  );
  return o;
};

// ========================== Get Id =================================== ||

exports.getOrderId = async (req, res, next, id) => {
  try {
    let Order = await orderModel
      .findById(id)
      .populate({
        path: "customerId partnerId cityId memberShipId",
      })
      .populate({
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

// ======================== Create Order ====================== ||

exports.createOrder = async (req, res) => {
  try {
    console.log("CREATE ORDER FUNCTION CALLED");
    const {
      customerId,
      cityId,
      orderTotal,
      taxAmount,
      couponeCode,
      couponeDiscount,
      addressId,
      date,
      time,
      totalOfferDiscount,
      netAmount,
      memberShipId,
      memberDiscount,
      memberDiscountPercent,
      paymentMethod,
      paymentStatus,
    } = req.body;
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "CustomerId Is Required...",
      });
    }
    if (!orderTotal) {
      return res.status(400).json({
        success: false,
        message: "orderTotal Is Required...",
      });
    }

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "addressId Is Required...",
      });
    }
    if (!netAmount) {
      return res.status(400).json({
        success: false,
        message: "netAmount Is Required...",
      });
    }
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod Is Required",
      });
    }
    if (paymentMethod !== "COD" && paymentMethod !== "ONLINE") {
      return res.status(400).json({
        success: false,
        message: "paymentMethod Only Use (COD && ONLINE)",
      });
    }

    let add = await addressModel.findById({ _id: addressId });
    // let add = await addressModel.findById({ _id: addressId });
    let checkState;
    let lowerCaseString;
    let capitalizedString;
    let finalString;
    if (add) {
      local.localState.some((state) => {
        // console.log(state)
        (lowerCaseString = state.toLowerCase()),
          // Capitalize the first letter
          (capitalizedString =
            lowerCaseString.charAt(0).toUpperCase() + lowerCaseString.slice(1)),
          // Insert a space between "Madhya" and "Pradesh"
          (finalString =
            capitalizedString.slice(0, 6) + " " + capitalizedString.slice(6));
      });
      checkState = finalString?.toLowerCase() === add?.state?.toLowerCase();
    }

    let completedOtp = otp();
    let workingOtp = otp();
    let arr = [];
    let Cart = await cartModel
      .find({ customerId: customerId })
      .populate("productId customerId");
    console.log("DJDJDHDHDHDYDYD", Cart);

    if (!Cart.length) {
      return res
        .status(400)
        .json({ success: false, message: "Cart Not Found" });
    }
    for (let i = 0; i < Cart.length; i++) {
      let per = await productModel
        .findByIdAndUpdate({ _id: Cart[i]?.productId?._id })
        .populate("taxId");
      console.log("DKDDDKDKKDDDDDDDDDDDDDDDDDDD");
      obj = {};
      obj.image = Cart[i]?.image;
      obj.productId = Cart[i]?.productId;
      obj.price = Cart[i]?.price;
      obj.quantity = Cart[i]?.quantity;
      obj.taxPersent = per?.taxId?.taxPercent;
      arr.push(obj);
    }
    function combineDateAndTime(dateString, timeString) {
      const date = new Date(dateString);
      let [time, modifier] = timeString?.split(" ");
      let [hours, minutes, seconds] = time?.split(":");

      if (modifier === "PM") {
        hours = (parseInt(hours, 10) % 12) + 12;
      } else {
        hours = parseInt(hours, 10) % 12;
      }

      date.setHours(hours);
      date.setMinutes(parseInt(minutes, 10));
      date.setSeconds(parseInt(seconds, 10) || 0);

      const isoString = date?.toUTCString();
      return isoString;
    }
    var dates = combineDateAndTime(date, time);
    console.log("JDJDJD", dates);
    let Order = await orderModel.create({
      customerId: customerId,
      cityId: cityId,
      orderTotal: orderTotal,
      taxAmount: taxAmount,
      couponeCode: couponeCode,
      couponeDiscount: couponeDiscount,
      totalOfferDiscount: totalOfferDiscount,
      netAmount: netAmount,
      address: add,
      product: arr,
      checkState: checkState,
      memberShipId: memberShipId,
      memberDiscount: memberDiscount,
      memberDiscountPercent: memberDiscountPercent,
      workingOtp: workingOtp,
      completedOtp: completedOtp,
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod == "COD" ? "PAID" : "UNPAID",
      date: new Date(dates).toLocaleString(),
      time: time,
      // invoice: IntersectionObserverEntry
    });

    // console.log(Cart[0]?.customerId?.email)
    // Cart[0]?.customerId?.email
    // ?
    sendMailOTP(Cart[0]?.customerId?.email, "Thanks for your Order");
    // :
    sendOtpFunction(Cart[0]?.customerId?.phoneNumber, "Thanks for your Order");
    
    await cartModel.deleteMany({ customerId: customerId });

    sendNotificationCreateSurviceAdminAndSubAdmin(Order._id);

    if (paymentMethod == "COD") {
      let code = await invoice(Order);
      Order = await orderModel.findByIdAndUpdate(
        { _id: Order?._id },
        {
          $set: {
            invoice: `HomeService/${code}.pdf`,
            status: "ORDERED",
          },
        },
        { new: true }
      );
    }
    return res.status(200).json({
      success: true,
      message: "Order Is Created Successfully...",
      data: Order,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ======================== Update Status And Transtion Id ================================ ||

exports.updateTransactionId = async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction Id Is Required...",
      });
    }
    let code = await invoice(req.Order);
    console.log(code);
    let updateOrder = await orderModel.findByIdAndUpdate(
      { _id: req.Order._id },
      {
        $set: {
            status: OrderService.ORDERED,
            transactionId: transactionId,
            paymentStatus: "PAID",
            invoice: `HomeService/${code}.pdf`,
        },
      },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "Order Update Successfully...",
      data: updateOrder,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

exports.updateWorkingStatus = async (req, res) => {
  try {
    const { workingOtp } = req.body;

    let arr = [];
    if (!workingOtp) {
      return res.status(400).json({
        success: false,
        message: "WorkingOtp Id Is Required...",
      });
    }
    if (workingOtp != req.Order.workingOtp) {
      return res.status(400).json({
        success: false,
        message: "Please Provide Valide WorkingOtp",
      });
    }
    if (req.files) {
      req.files?.beforeWorkingImage?.map((o) => {
        arr.push(o.key);
      });
    }
    let updateOrder = await orderModel
      .findByIdAndUpdate(
        { _id: req.Order._id },
        {
          $set: {
            status: OrderService.WORKING,
            beforeWorkingImage: arr,
          },
        },
        { new: true }
      )
      .populate("customerId")
      .populate("partnerId");
    sendNotificationToUserByPartner(
      updateOrder,
      OrderService.WORKING,
      updateOrder.partnerId.fullName
    );
    return res.status(200).json({
      success: true,
      message: "Status Update Successfully...",
      data: updateOrder,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ======================== Update Status And Transtion Id ================================ ||

exports.updateCompletedStatus = async (req, res) => {
  try {
    const {
      completedOtp,
      sparePartsAmount,
      transportAmount,
      courierAmount,
      remark,
    } = req.body;
    // completedOtp: '',
    //     sparePartsAmount: null,
    //     transportAmount: null,
    //     courierAmount: null,
    //     remark: null,
    //     afterWorkingImage: []
    let arr = [];
    if (!completedOtp) {
      return res.status(400).json({
        success: false,
        message: "completedOtp Id Is Required...",
      });
    }
    if (completedOtp != req.Order.completedOtp) {
      return res.status(400).json({
        success: false,
        message: "Please Provide Valide completedOtp",
      });
    }
    if (req.files) {
      req.files?.afterWorkingImage?.map((o) => {
        arr.push(o.key);
      });
    }
    let updateOrder = await orderModel
      .findByIdAndUpdate(
        { _id: req.Order._id },
        {
          $set: {
            status: OrderService.COMPLETED,
            afterWorkingImage: arr,
            sparePartsAmount: sparePartsAmount,
            transportAmount: transportAmount,
            courierAmount: courierAmount,
            remark: remark,
          },
        },
        { new: true }
      )
      .populate("customerId")
      .populate("partnerId");
    // updateOrder?.customerId?.email
    //   ?
    sendMailOTP(
      updateOrder?.customerId?.email,
      "Your order has been Completed"
    );
    // :
    sendOtpFunction(
      updateOrder?.customerId?.phoneNumber,
      "Your order has been Completed"
    );
    sendNotificationToUserByPartner(
      updateOrder,
      OrderService.COMPLETED,
      updateOrder.partnerId.fullName
    );
    return res.status(200).json({
      success: true,
      message: "Status Update Successfully...",
      data: updateOrder,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};
// ============================= Cancle Order ============================ ||

exports.cancelOrder = async (req, res) => {
  try {
    let { reason, status } = req.body;
    let cancleBy;
    if (req.Admin) {
      cancleBy = req.Admin.userType.includes("SUPER_ADMIN")
        ? "SUPER_ADMIN"
        : req.Admin.userType.includes("ADMIN")
        ? "ADMIN"
        : "SUB_ADMIN";
      reason = `Order Cancle By ${cancleBy}`;
    }
    if (req.User) {
      if (req.User._id == req.Order.customerId._id.toString()) {
        cancleBy = "COSTOMER";
      } else {
        cancleBy = "PATNER";
      }
    }
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "reason Is Required",
      });
    }
    let cancelData = await orderModel
      .findOneAndUpdate(
        { _id: req.Order._id },
        {
          $set: {
            status: status, //OrderService.CANCELLED,
            reason: reason,
            cancleBy: cancleBy,
          },
        },
        { new: true }
      )
      .populate("customerId");
    if (req.Admin) {
      sendNotificationCancleStatusByAdmin(cancelData, OrderService.CANCELLED);
    } else {
      sendNotificationSurviceAdminAndSubAdmin(
        cancelData,
        OrderService.CANCELLED
      );
    }
    return res.status(200).send({
      success: true,
      message: "Status Update Successfully...",
      data: cancelData,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ======================= Get All Order By CostomerId ============================ ||

exports.getAllOrderByCostomerId = async (req, res) => {
  try {
    let page = req.query.page;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    let data = await orderModel
      .find({ customerId: req.User._id })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex)
      .populate({
        path: "customerId partnerId cityId memberShipId",
      })
      .populate({
        path: "product.productId",
      });
    let length = await orderModel.countDocuments({ customerId: req.User._id });
    let count = Math.ceil(length / 20);
    // if (!data.length) {
    //   return res.status(400).send({
    //     success: false,
    //     message: "Order Not Found",
    //     data: data,
    //   });
    // }
    return res.status(200).send({
      success: true,
      message: "All Customer Order Is Fatch...",
      data: data,
      page: count,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// =========================== Get Order By Order Id =========================== ||

exports.getOrderByOrderId = async (req, res) => {
  try {
    let orderDetails = await orderModel
      .findById(req.Order._id)
      .select(
        "-_id orderTotal taxAmount date totalOfferDiscount status netAmount memberShipId workingOtp completedOtp couponeCode couponeDiscount memberDiscount memberDiscountPercent"
      );

    let order = await orderModel
      .findById(req.Order._id)
      .select(
        "-orderTotal -taxAmount -totalOfferDiscount -status -netAmount -memberShipId -workingOtp -completedOtp -couponeCode -couponeDiscount -memberDiscount -memberDiscountPercent"
      )
      .populate({
        path: "product.productId",
      })
      .populate("customerId partnerId");

    order._doc.orderDetails = orderDetails;
    console.log(new Date(order.date).toLocaleString());
    return res.status(200).send({
      success: true,
      message: "Order Fatch Successfully...",
      data: order,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ============================ filter Order ======================== ||

// exports.filterOrderByDate = async (req, res) => {
//   try {
//     const { status, filter, paymentMethod, search, livestatus } = req.query;
//     let obj = {};
//     let obj2 = {};
//     let turnOver = 0;
//     let pendingCount = 0;
//     let orderedCount = 0;
//     let acceptedCount = 0;
//     let onthewayCount = 0;
//     let workingCount = 0;
//     let completedCount = 0;
//     let cancelCount = 0;

//     if (status) {
//       if (!Object.values(OrderService).includes(status)) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "'PENDING','ORDERED','ACCEPTED','ONTHEWAY','WORKING','COMPLETED', 'CANCELLED' are the valid status options.",
//         });
//       } else {
//         obj.status = status;
//       }
//     }
//     if (livestatus == "true" && !status) {
//       obj.status = { $nin: ["PENDING", "COMPLETED", "CANCELLED"] };
//       obj2.date = -1;
//       if (req.filterQuery) {
//         obj.date = req.filterQuery;
//       }
//     }
//     else if (req.filterQuery) {
//       obj.createdAt = req.filterQuery;
//     }
//     if (paymentMethod) {
//       obj.paymentMethod = paymentMethod;
//     }
//     if (req.query.price) {
//       if (
//         req.query.price != "low_to_high" &&
//         req.query.price != "high_to_low"
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "'low_to_high', 'high_to_low' are the valid price options.",
//         });
//       } else {
//         if ((req.query.price = "low-to-high")) {
//           obj2.orderTotal = 1;
//         } else if (req.query.price == "high-to-low") {
//           obj2.orderTotal = -1;
//         }
//       }
//     }
//     // if(
//     let getData = await orderModel.find(obj).sort(obj2).populate({
//       path: "customerId",
//       select: "fullName",
//     });
//     // .populate({
//     //   path: "product.productId",
//     // });
//     let datas = "";
//     function applyFilters(getData) {
//       const search = req.query.search;
//       let filteredData = getData.filter((e) => {
//         let check = false;
//         if (search && search.length == 24) {
//           if (e?._id == search) {
//             check = true;
//             return e?._id == search;
//           }
//         } else if (!check) {
//           return (
//             !search || new RegExp(search, "i").test(e.customerId?.fullName)
//           );
//         }
//       });
//       filteredData.forEach((f) => {
//         if (f.status === "PENDING") {
//           pendingCount++;
//         } else if (f.status === "ORDERED") {
//           orderedCount++;
//         } else if (f.status === "ACCEPTED") {
//           acceptedCount++;
//         } else if (f.status === "ONTHEWAY") {
//           onthewayCount++;
//         } else if (f.status === "WORKING") {
//           workingCount++;
//         } else if (f.status === "COMPLETED") {
//           completedCount++;
//         } else if (f.status === "CANCELLED") {
//           cancelCount++;
//         }

//         if (f.orderTotal) {
//           turnOver += f.orderTotal;
//         }
//       });

//       return {
//         filteredData,
//         pendingCount,
//         orderedCount,
//         acceptedCount,
//         onthewayCount,
//         workingCount,
//         completedCount,
//         cancelCount,
//         turnOver,
//       };
//     }
//     const result = applyFilters(getData);
//     let page = req.query.page;
//     const startIndex = page ? (page - 1) * 20 : 0;
//     const endIndex = startIndex + 20;
//     let length = result.filteredData.length;
//     let count = Math.ceil(length / 20);
//     let data = result.filteredData.slice(startIndex, endIndex);
//     return res.status(200).json({
//       success: true,
//       message: "Order Is Filter Successfully...",
//       data: datas ? datas : data,
//       stats: {
//         turnOver: turnOver,
//         pendingCount: pendingCount,
//         orderedCount: orderedCount,
//         acceptedCount: acceptedCount,
//         onthewayCount: onthewayCount,
//         workingCount: workingCount,
//         completedCount: completedCount,
//         cancelCount: cancelCount,
//       },
//       page: count,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.filterOrderByDate = async (req, res) => {
  try {
    const { status, filter, paymentMethod, search, livestatus, price, page } =
      req.query;
    let filterCriteria = {};
    let sortCriteria = {};
    let turnOver = 0,
      pendingCount = 0,
      orderedCount = 0,
      acceptedCount = 0;
    let onthewayCount = 0,
      workingCount = 0,
      completedCount = 0,
      cancelCount = 0;

    if (status && !Object.values(OrderService).includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status options." });
    } else if (status) {
      filterCriteria.status = status;
    }
    let check = false;
    if (livestatus === "true" && !status) {
      check = true;
      console.log("DKDKDKDKKD");
      filterCriteria.status = { $nin: ["PENDING", "COMPLETED", "CANCELLED"] };
      // sortCriteria.new Date(date) = -1;
    } else if (req.filterQuery) {
      filterCriteria.createdAt = req.filterQuery;
    }
    if (livestatus === "false") {
      sortCriteria.createdAt = -1;
    }
    if (paymentMethod) filterCriteria.paymentMethod = paymentMethod;
    //  console.log(req.filterQuery)
    if (price) {
      if (price !== "low_to_high" && price !== "high_to_low") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid price options." });
      } else {
        sortCriteria.orderTotal = price === "low_to_high" ? 1 : -1;
      }
    }

    const getData = await orderModel
      .find(filterCriteria)
      .sort(sortCriteria)
      .populate({
        path: "customerId",
        select: "fullName",
      })
      .populate({
        path: "product.productId",
        select: "title",
      })
      .populate({
        path: "partnerId",
        select: "fullName phoneNumber",
      });

    const filteredData = getData.filter((e) => {
      if (search && search.length == 24) {
        return e?._id == search;
      } else {
        return !search || new RegExp(search, "i").test(e.customerId?.fullName);
      }
    });

    filteredData.forEach((f) => {
      switch (f.status) {
        case "PENDING":
          pendingCount++;
          break;
        case "ORDERED":
          orderedCount++;
          break;
        case "ACCEPTED":
          acceptedCount++;
          break;
        case "ONTHEWAY":
          onthewayCount++;
          break;
        case "WORKING":
          workingCount++;
          break;
        case "COMPLETED":
          completedCount++;
          break;
        case "CANCELLED":
          cancelCount++;
          break;
      }
      if (f.orderTotal) turnOver += f.orderTotal;
    });

    // var date;
    if (check) {
      var date = filteredData;
      let check1 = false;
      if (req.filterQuery) {
        console.log(req.filterQuery);
        check1 = true;
        date = filteredData.filter((item) => {
          const itemDate = new Date(item.date);
          if (filter == "total") {
            return itemDate <= new Date(req.filterQuery.$lte);
          } else {
            return (
              itemDate >= new Date(req.filterQuery.$gte) &&
              itemDate <= new Date(req.filterQuery.$lte)
            );
          }
        });
      }
      if (check1) {
        date.sort((a, b) => new Date(b.date) - new Date(a.date));
      } else {
        date.sort((a, b) => new Date(a.date) - new Date(b.date));
      }
    }

    const pageData = page ? (page - 1) * 20 : 0;
    const resultData = date
      ? date.slice(pageData, pageData + 20)
      : filteredData.slice(pageData, pageData + 20);

    return res.status(200).json({
      success: true,
      message: "Order Is Filtered Successfully...",
      data: resultData,
      stats: {
        turnOver,
        pendingCount,
        orderedCount,
        acceptedCount,
        onthewayCount,
        workingCount,
        completedCount,
        cancelCount,
      },
      page: date
        ? Math.ceil(date.length / 20)
        : Math.ceil(filteredData.length / 20),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================== getAllDataByPartnerId ====================

exports.getOrderByPartnerId = async (req, res) => {
  try {
    const { page } = req.query;
    const orderedQuery1 = {
      partnerId: req.params.userId,
      status: { $ne: OrderService.COMPLETED },
    };
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    let dataByPartnerId = await orderModel
      .find(orderedQuery1)
      .sort({ updatedAt: -1 })
      .skip(startIndex)
      .limit(endIndex)
      .populate({
        path: "customerId partnerId",
      })
      .populate({
        path: "product.productId",
      });
    let length = await orderModel.countDocuments(orderedQuery1);
    let count = Math.ceil(length / 20);
    return res.status(200).send({
      success: true,
      message: "Data fetched By PartnerId successfully",
      data: dataByPartnerId,
      page: count,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// =========================== onTheWayStatusUpdate ===============================

exports.onTheWayStatusUpdate = async (req, res) => {
  try {
    let dataByPartnerId = await orderModel
      .findOneAndUpdate(
        {
          _id: req.Order._id,
          partnerId: req.User._id,
        },
        { $set: { status: OrderService.ONTHEWAY } },
        { new: true }
      )
      .populate({
        path: "customerId partnerId cityId memberShipId",
      })
      .populate({
        path: "product.productId",
      });
    if (!dataByPartnerId) {
      return res.status(400).json({
        success: false,
        message: "Order Not Found",
      });
    }
    sendNotificationToUserByPartner(
      dataByPartnerId,
      OrderService?.ONTHEWAY,
      dataByPartnerId?.partnerId?.fullName
    );
    return res.status(200).send({
      success: true,
      message: "Status Update Successfully...",
      data: dataByPartnerId,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// =========================== acceptedStatusUpdate ===============================

exports.acceptedStatusUpdate = async (req, res) => {
  try {
    let dataByPartnerId = await orderModel
      .findOneAndUpdate(
        {
          _id: req.Order._id,
        },
        { $set: { status: OrderService.ACCEPTED, partnerId: req.User._id } },
        { new: true }
      )
      .populate({
        path: "customerId partnerId cityId memberShipId",
      })
      .populate({
        path: "product.productId",
      });
    // dataByPartnerId?.customerId?.email
    //   ?
    sendMailOTP(
      dataByPartnerId?.customerId?.email,
      "Your order has been confirmed"
    );
    // :
    sendOtpFunction(
      dataByPartnerId?.customerId?.phoneNumber,
      "Your order has been confirmed"
    );
    sendNotificationToUserByPartner(
      dataByPartnerId,
      OrderService?.ACCEPTED,
      dataByPartnerId?.partnerId?.fullName
    );
    return res.status(200).send({
      success: true,
      message: "Status Update Successfully...",
      data: dataByPartnerId,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ======================== Create Order By Admin ====================== ||
exports.createOrderByAdmin = async (req, res) => {
  try {
    let userdata;
    const {
      fullName,
      phoneNumber,
      customerId,
      // cityId,
      orderTotal,
      taxAmount,
      couponeCode,
      couponeDiscount,
      firstName, //
      lastName, //
      mobile, //
      address, //
      apartment, //
      landmark, //
      area, //
      city, //
      pinCode,
      country,
      date,
      time,
      state,
      latitude,
      longitude,
      totalOfferDiscount,
      netAmount,
      memberShipId,
      memberDiscount,
      memberDiscountPercent,
    } = req.body;
    if (!customerId && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Customer Is Required...",
      });
    }
    if (!orderTotal) {
      return res.status(400).json({
        success: false,
        message: "orderTotal Is Required...",
      });
    }
    if (!taxAmount) {
      return res.status(400).json({
        success: false,
        message: "taxAmount Is Required...",
      });
    }
    if (!netAmount) {
      return res.status(400).json({
        success: false,
        message: "netAmount Is Required...",
      });
    }
    const check = await userModel.findOne({ phoneNumber: phoneNumber });
    if (!check && phoneNumber) {
      if (!fullName) {
        return res
          .status(400)
          .send({ success: false, message: "Enter Your Full Name" });
      }
      if (!phoneNumber) {
        return res
          .status(400)
          .send({ success: false, message: "Enter Your Phone Number" });
      }
      if (!validateMobileNumber(phoneNumber)) {
        return res.status(400).send({
          success: false,
          message: "please provide valid 10 digit number",
        });
      }
      userdata = await userModel.create({
        fullName: fullName,
        phoneNumber: phoneNumber,
      });
    }
    let completedOtp = otp();
    let workingOtp = otp();
    let arr = [];
    let Cart = await cartModel
      .find({ customerId: req.Admin._id })
      .populate("productId");
    if (!Cart.length) {
      return res
        .status(400)
        .json({ success: false, message: "Cart Not Found" });
    }
    // for (let i = 0; i < Cart.length; i++) {
    //   obj = {};
    //   obj.image = Cart[i].image;
    //   obj.productId = Cart[i].productId;
    //   obj.price = Cart[i].price;
    //   obj.quantity = Cart[i].quantity;
    //   obj.taxPersent = per?.taxId?.taxPercent;
    //   arr.push(obj);
    // }
    for (let i = 0; i < Cart.length; i++) {


      let per = await productModel
        .findByIdAndUpdate({ _id: Cart[i]?.productId?._id })
        .populate("taxId");
      console.log("DKDDDKDKKDDDDDDDDDDDDDDDDDDD");
      obj = {};
      obj.image = Cart[i]?.image;
      obj.productId = Cart[i]?.productId;
      obj.price = Cart[i]?.price;
      obj.quantity = Cart[i]?.quantity;
      obj.taxPersent = per?.taxId?.taxPercent;
      arr.push(obj);
    }
    let add = {};
    (add.firstName = firstName),
      (add.lastName = lastName),
      (add.mobile = mobile),
      (add.address = address),
      (add.apartment = apartment),
      (add.landmark = landmark),
      (add.area = area),
      (add.city = city),
      (add.latitude = latitude),
      (add.longitude = longitude);
    add.pinCode = pinCode;
    add.state = state;
    add.country = country;
    const Order = await orderModel.create({
      paymentMethod: "PAYMENT_ACCEPTED_ADMIN",
      status: "ORDERED",
      customerId: customerId
        ? customerId
        : check != null
        ? check._id
        : userdata._id,
      // cityId: cityId,
      date: date,
      time: time,
      orderTotal: orderTotal,
      taxAmount: taxAmount,
      couponeCode: couponeCode,
      couponeDiscount: couponeDiscount,
      totalOfferDiscount: totalOfferDiscount,
      netAmount: netAmount,
      address: add,
      product: arr,
      memberShipId: memberShipId,
      memberDiscount: memberDiscount,
      memberDiscountPercent: memberDiscountPercent,
      workingOtp: workingOtp,
      completedOtp: completedOtp,
    });
    if (Order) {
      let code = await invoice(Order);
      await orderModel.updateOne(
        { _id: Order?._id },
        { $set: { invoice: `HomeService/${code}.pdf` } }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Order Is Created Successfully By Admin..",
      data: Order,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};


// =========================== acceptedStatusUpdate ===============================

exports.AssignePartnerByAdmin = async (req, res) => {
  try {
    let dataByPartnerId = await orderModel
      .findOneAndUpdate(
        {
          _id: req.Order._id,
        },
        { $set: { status: OrderService.ACCEPTED, partnerId: req.User._id } },
        { new: true }
      )
      .populate({
        path: "customerId partnerId cityId memberShipId",
      })
      .populate({
        path: "product.productId",
      });
    // dataByPartnerId?.customerId?.email
    //   ?
    sendMailOTP(
      dataByPartnerId?.customerId?.email,
      "Your order has been confirmed"
    );
    // :
    sendOtpFunction(
      dataByPartnerId?.customerId?.phoneNumber,
      "Your order has been confirmed"
    );
    sendNotificationToPartnerByAdmin(dataByPartnerId, OrderService.ACCEPTED);
    return res.status(200).send({
      success: true,
      message: "Status Update Successfully...",
      data: dataByPartnerId,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ======================= Get All Order By CostomerId ============================ ||

exports.getAllOrderByCity = async (req, res) => {
  try {
    let { page, city, partnerId } = req.query;
    if (!city) {
      return res.status(400).json({
        success: false,
        message: "city is required",
      });
    }
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    let date = await partnerProfileModel
      .findOne({ userId: partnerId })
      .select("createdAt");
    const orderedQuery = {
      "address.city": city,
      status: OrderService.ORDERED,
      createdAt: { $gte: new Date(`${date?.createdAt}`) },
    };
    let data = await orderModel
      .find(orderedQuery)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex)
      .populate({
        path: "customerId",
      })
      .populate({
        path: "product.productId",
      });
    let length = await orderModel.countDocuments({
      "address.city": city,
      status: OrderService.ORDERED,
    });
    let count = Math.ceil(length / 20);
    return res.status(200).send({
      success: true,
      message: "All Pending Order Is Fatch...",
      data: data,
      page: count,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ======================= Get All Order By CostomerId ============================ ||

exports.orderDashboardOfPatner = async (req, res) => {
  try {
    const { city, partnerId } = req.query;
    if (!city) {
      return res.status(400).json({
        success: false,
        message: "city is required",
      });
    }
    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: "partnerId is required",
      });
    }
    const status = [
      OrderService.COMPLETED,
      // OrderService.WORKING,
      OrderService.ACCEPTED,
    ];
    const status1 = [
      // OrderService.COMPLETED,
      // OrderService.PENDING,
      OrderService.WORKING,
      OrderService.ACCEPTED,
      OrderService.ONTHEWAY,
    ];
    const status2 = [
      // OrderService.COMPLETED,
      OrderService.WORKING,
      OrderService.ACCEPTED,
      OrderService.ONTHEWAY,
    ];

    const statusCounts = {};

    for (const s of status) {
      const query = {
        // "address.city": city,
        partnerId: partnerId,
        status: s,
      };
      statusCounts[s] = await orderModel.countDocuments(query);
    }
    let date = await partnerProfileModel
      .findOne({ userId: partnerId })
      .select("createdAt");
    // console.log(date)
    const orderedQuery = {
      "address.city": city,
      status: OrderService.ORDERED,
      createdAt: { $gte: new Date(`${date?.createdAt}`) },
    };
    const orderedQuery1 = {
      partnerId: partnerId,
      status: { $in: status1 },
    };
    const orderedQuery2 = {
      partnerId: partnerId,
      status: { $in: status2 },
    };
    let all = await orderModel.countDocuments(orderedQuery1);
    statusCounts[OrderService.ACCEPTED] = await orderModel.countDocuments(
      orderedQuery2
    );
    statusCounts[OrderService.ORDERED] = await orderModel.countDocuments(
      orderedQuery
    );
    statusCounts["ALLORDER"] = all + statusCounts[OrderService.ORDERED];
    return res.status(200).send({
      success: true,
      message: "Status counts fetched successfully...",
      data: statusCounts,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

exports.getPartnerCompletedOrder = async (req, res) => {
  try {
    const { page } = req.query;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    let findCompletedOrder = await orderModel
      .find({
        partnerId: req.params.partnerId,
        status: OrderService.COMPLETED,
      })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex)
      .populate({
        path: "customerId partnerId",
      })
      .populate({
        path: "product.productId",
      });
    let length = await orderModel.countDocuments({
      partnerId: req.params.partnerId,
      status: OrderService.COMPLETED,
    });
    let count = Math.ceil(length / 20);
    return res.status(200).send({
      success: true,
      message: "order fatch successfully..",
      data: findCompletedOrder,
      page: count,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

exports.getAllOrderByPartnerId = async (req, res) => {
  try {
    const { page = 1, city } = req.query;
    const pageSize = 20;
    const startIndex = (page - 1) * pageSize;

    // Fetch orders by partnerId
    const dataByPartnerId = await orderModel
      .find({ partnerId: req.params.partnerId })
      .sort({ createdAt: -1 })
      .populate({
        path: "customerId partnerId",
      })
      .populate({
        path: "product.productId",
      });

    // Fetch orders by city and status ORDERED
    const dataOrder = await orderModel
      .find({ "address.city": city, status: OrderService.ORDERED })
      .sort({ createdAt: -1 })
      .populate({
        path: "customerId partnerId",
      })
      .populate({
        path: "product.productId",
      });

    // Combine and sort both datasets by createdAt
    const combinedData = dataByPartnerId.concat(dataOrder);
    // .sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const paginatedData = combinedData.slice(startIndex, startIndex + pageSize);
    const totalItems = combinedData.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    return res.status(200).send({
      success: true,
      message: "Data fetched by PartnerId and city successfully",
      data: paginatedData,
      page: page,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};
