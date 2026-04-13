const { userType } = require("../helper/userType");
const notificationModel = require("../models/notificationModel");
const admin = require("firebase-admin");
const serviceAccount = require("../../config/serviceAccount.json");
const userModel = require("../models/userModel");
const orderModel = require("../models/ecommerce/orderModel");
const orderService = require("../models/orderModel");
const { OrderCreate } = require("../helper/notificationMessage");



if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function sendPushNotification(message) {
  try {

    if (!message?.tokens || message.tokens.length === 0) {
      console.log("No FCM tokens provided");
      return;
    }

    const response = await admin.messaging().sendEachForMulticast(message);
    response.responses.forEach((r, index) => {
      if (!r.success) {
        console.log("FCM ERROR CODE:", r.error.code);
        console.log("FCM ERROR MESSAGE:", r.error.message);
      }
    });

    console.log("FCM Response:", response);
    return response;
  } catch (error) {
    console.error("Error sending message:", error.message);
    throw error;
  }
}

// exports.sendNotificationAdminAndSubAdmin = async (orderId, status) => {
//   // try {
//   // const orderId = req.params.orderId;
//   // const customerId = req.body.customerId;

//   // const order = orderId
//   //   ? await orderModel.findById(orderId).populate("customerId")
//   //   : null;
//   // const customer = await userModel.findById(customerId);

//   // Find admins and sub-admins with FCM tokens
//   const adminSubAdminFilter = {
//     userType: {
//       $in: [userType.admin, userType.subAdmin, userType.superAdmin],
//     },
//   };

//   const adminSubAdminFields = [
//     "adminFcmToken",
//     "subAdminFcmToken",
//     "superAdminFcmToken",
//   ];
//   const data = await userModel.find(adminSubAdminFilter).select("userType");
//   const User = await userModel
//     .find(adminSubAdminFilter)
//     .select(adminSubAdminFields.join(" "));
//   // console.log(User);
//   const fcmToken = User
//     .map((user) => adminSubAdminFields.map((field) => user[field]))
//     .flat()
//     .filter((token) => token !== undefined && token !== null);

//     // console.log(fcmToken);

//    const order = await orderModel.findById(orderId);

//    const notifications = data.map((user) => {
//     const title = "Ecommerce Order";
//     // console.log(order?.customerId?.fullName)
//     const message = `Customer Id ${order?.customerId} Is ${status} This Order`;
//     return {
//       title,
//       message,
//       seen: false,
//       date: new Date(),
//       userId: user?._id,
//       orderId: orderId,
//       chatUserId:order?.customerId,
//       type: "ECOM_ORDERED",
//       userType: user.userType.includes(userType.superAdmin)
//         ? userType.superAdmin
//         : user.userType?.includes(userType.admin)
//           ? userType.admin
//           : userType.subAdmin,
//     };
//   });

// Log FCM tokens and send push notifications
// console.log("fcmToken", fcmToken);

// temperary commentout
// const message1 = {
//   notification: {
//     title: "Order",
//     body: `User Is ${status} This Order`,
//   },
//   data: {
//     orderId: orderId?._id,
//     type: "ECOM_ORDERED",
//   },
//   tokens: fcmToken,
// };
// if (fcmToken.length > 0) {
//   sendPushNotification(message1);
// }
//----------------------------
//   // Insert notifications into the database (assuming a bulk insert method)
//   await notificationModel.insertMany(notifications);

//   // next();
//   // } catch (error) {
//   //   // console.error("Error:", error);
//   //   return res.status(500).json({ success: false, message: error.message });
//   // }
// };

// exports.testFcmNotification = async (req, res) => {
//   try {
//     const message = {
//       tokens: [
//         "cvVYwg0c8C2AZDImHULkq4:APA91bEbv6VlZPGYyLZmkBzvWCCVMy8yCmxG3-U7zs33mSoD3wfyofUbM318Gamq2Ese9kCNd69hwY6xIcniWPVR0crertEpLoImhrwNxGluzMNINCrkywc"
//       ],
//       notification: {
//         title: "Test ",
//         body: "Backend se test notification"
//       }
//     };

//     const response = await admin.messaging().sendMulticast(message);

//     return res.json({
//       success: true,
//       response
//     });

//   } catch (error) {
//     console.error("FCM ERROR:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };


// exports.sendNotificationAdminAndSubAdminAfterOrderCreate = async (orderId) => {
//   // try {
//   // Find the order and customer
//   console.log(orderId);
//   const order = await orderModel
//     .findById({ _id: orderId })
//     .populate("customerId");
//   // const customer = await userModel.findById(customerId);
//   console.log(order);
//   // Find admins and sub-admins with FCM tokens
//   const adminSubAdminFilter = {
//     userType: {
//       $in: [userType.admin, userType.subAdmin, userType.superAdmin],
//     },
//   };

//   const adminSubAdminFields = [
//     "adminFcmToken",
//     "subAdminFcmToken",
//     "superAdminFcmToken",
//   ];
//   const data = await userModel.find(adminSubAdminFilter).select("userType");
//   const User = await userModel
//     .find(adminSubAdminFilter)
//     .select(adminSubAdminFields.join(" "));
//   const fcmToken = User
//     .map((user) => adminSubAdminFields.map((field) => user[field]))
//     .flat()
//     .filter((token) => token !== undefined && token !== null);
//   const notifications = data.map((user) => {
//     const title = OrderCreate?.title;
//     const message = OrderCreate?.message;
//     // :
//     return {
//       title,
//       message,
//       seen: false,
//       date: new Date(),
//       userId: user._id,
//       orderId: order ? order._id : "",
//       type: "ECOM_ORDERED",
//       userType: user.userType.includes(userType.superAdmin)
//         ? userType.superAdmin
//         : user.userType?.includes(userType.admin)
//           ? userType.admin
//           : userType.subAdmin,
//     };
//   });

//   // Log FCM tokens and send push notifications
//   // console.log("fcmToken", fcmToken);
//   const message1 = {
//     notification: {
//       title: OrderCreate?.title,
//       body: OrderCreate?.message,
//     },
//     data: {
//       orderId: `${order}` ? `${order._id}` : "",
//       type: "ECOM_ORDERED",
//     },
//     tokens: fcmToken,
//   };
//   if (fcmToken.length > 0) {
//     sendPushNotification(message1);
//   }

//   // Insert notifications into the database (assuming a bulk insert method)
//   await notificationModel.insertMany(notifications);

//   // next();
//   // } catch (error) {
//   //   // console.error("Error:", error);
//   //   return res.status(500).json({ success: false, error: error.message });
//   // }
// };

exports.sendNotificationUserOnStatusUpdate = async (orderId, status) => {
  // try {
  let fcmToken = [];
  // let order = await orderModel
  //   .findById(req.params.orderId)
  //   .populate("customerId");
  // console.log(order?.customerId?.customerFcmToken);
  // console.log("orderId",orderId)
  if (orderId) {
    fcmToken.push(orderId?.customerId?.customerFcmToken);
    await notificationModel.create({
      title: "Your Order",
      message: `Your Order Is Successfully ${status}`,
      // icon: String,
      seen: false,
      orderId: orderId?._id,
      type: "ECOM_ORDERED",
      date: new Date(),
      userId: orderId?.customerId?._id,
      userType: "CUSTOMER",
    });
  }
  let message1 = {
    notification: {
      title: "Your Order",
      body: `Your Order Is Successfully ${status}`,
    },
    data: {
      orderId: `${orderId?._id}`, // Include orderId as data
      type: "ECOM_ORDERED", // Include type as data
    },
    tokens: fcmToken,
  };
  // console.log(message1);
  if (fcmToken.length > 0) {
    sendPushNotification(message1);
  }
  //   next();
  // } catch (error) {
  //   return res.status(500).json({ success: false, message: error.message });
  // }
};



exports.sendRefundRequestNotification = async ({
  userId,          // direct userId
  refundFor,       // "ECOMMERS" | "SERVICES"
  refId            // orderId OR bookingId (string)
}) => {
  // try {
  let fcmTokens = [];

  const user = await userModel.findById(userId).select("customerFcmToken");

  if (user?.customerFcmToken) {
    fcmTokens.push(user.customerFcmToken);
  }

  const isOrder = refundFor === "ECOMMERS";

  const title = "Refund Request Submitted";

  const message = isOrder
    ? `Your refund request for Order ID ${refId} has been submitted successfully.`
    : `Your refund request for Service ID ${refId} has been submitted successfully.`;

  await notificationModel.create({
    title,
    message,
    seen: false,
    date: new Date(),
    orderId: refId,
    userId: userId,
    userType: "CUSTOMER",
    type: isOrder ? "ORDER_REFUND_REQUEST" : "SERVICE_REFUND_REQUEST",
  });

  const pushPayload = {
    notification: {
      title,
      body: message,
    },
    data: {
      type: isOrder ? "ORDER_REFUND_REQUEST" : "SERVICE_REFUND_REQUEST",
      orderId: String(refId),
    },
    tokens: fcmTokens,
  };

  if (fcmTokens.length > 0) {
    await sendPushNotification(pushPayload);
  }

  // } catch (error) {
  //   console.error("Refund notification error:", error);
  // }
};


// ====================  Get by notificationId  ======================= //

exports.getByNotificationId = async (req, res) => {
  try {
    let check = await notificationModel.findById({
      _id: req.params.notificationId,
    });
    if (!check) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Notification Fatch Successfully...",
      data: check,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ====================  Get by userId  ======================= //

exports.getByUserId = async (req, res) => {
  try {
    let obj = {};
    if (req.query.userType) {
      obj.userType = req.query.userType;
    }
    if (req.params.userId) {
      obj.userId = req.params.userId;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalNotifications = await notificationModel.countDocuments(obj);
    const totalPages = Math.ceil(totalNotifications / limit);

    let check = await notificationModel
      .find(obj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    await notificationModel.updateMany(
      { userId: req.params.userId, userType: req.query.userType },
      { $set: { seen: true } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Notification Fetch Successfully...",
      data: check,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalNotifications: totalNotifications,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendNotificationToAllUser = async (req, res) => {
  try {
    let fcmToken = [];
    if (!req.body.title) {
      return res.status(400).json({
        success: false,
        message: "title is required",
      });
    }
    if (!req.body.message) {
      return res.status(400).json({
        success: false,
        message: "message is required",
      });
    }
    let User = await userModel.find({
      userType: {
        $ne: [userType.admin, userType.subAdmin, userType.superAdmin],
      },
    });

    if (User.length > 0) {
      for (let i = 0; i < User.length; i++) {
        if (User[i]?.customerFcmToken !== undefined) {
          fcmToken.push(User[i]?.customerFcmToken);
        }
        await notificationModel.create({
          title: req.body.title,
          message: req.body.message,
          // icon: String,
          seen: false,
          date: new Date(),
          userId: User[i]._id,
          userType: "CUSTOMER",
        });
      }
    }
    let message1 = {
      notification: {
        title: req.body.title,
        body: req.body.message,
      },
      tokens: fcmToken,
    };
    if (fcmToken.length > 0) {
      sendPushNotification(message1);
    }
    return res.status(200).json({
      success: true,
      message: "notification send successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// send to single user

exports.sendNotificationToSingleUser = async (req, res) => {
  try {
    let fcmToken = [];
    if (!req.body.title) {
      return res.status(400).json({
        success: false,
        message: "title is required",
      });
    }
    if (!req.body.message) {
      return res.status(400).json({
        success: false,
        message: "message is required",
      });
    }

    if (!req.body.userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }
    let User = await userModel.findOne({ _id: req.body.userId });
    console.log(User)
    if (!User) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    if (User) {
      if (User.customerFcmToken !== undefined) {
        fcmToken.push(User.customerFcmToken);
      }
      await notificationModel.create({
        title: req.body.title,
        message: req.body.message,
        // icon: String,
        seen: false,
        date: new Date(),
        userId: User._id,
        userType: "CUSTOMER",
      });
    }

    console.log(fcmToken)
    let payload = {
      tokens: fcmToken,
      notification: {
        title: req.body.title,
        body: req.body.message,
      },
    };
    if (fcmToken.length > 0) {
      sendPushNotification(payload);
    }
    return res.status(200).json({
      success: true,
      message: "notification send successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// exports.sendNotificationCreateSurviceAdminAndSubAdmin = async (orderId) => {
//   // Find the order and customer
//   const order = await orderService.findById(orderId).populate("customerId");

//   // Find admins and sub-admins with FCM tokens
//   const adminSubAdminFilter = {
//     userType: {
//       $in: [
//         userType.admin,
//         userType.subAdmin,
//         userType.superAdmin,
//         userType.partner,
//       ],
//     },
//   };

//   const adminSubAdminFields = [
//     "adminFcmToken",
//     "subAdminFcmToken",
//     "superAdminFcmToken",
//     "partnerFcmToken",
//   ];
//   const data = await userModel.find(adminSubAdminFilter).select("userType");
//   const User = await userModel
//     .find(adminSubAdminFilter)
//     .select(adminSubAdminFields.join(" "));
//   // console.log(User);
//   const fcmToken = User
//     .map((user) => adminSubAdminFields.map((field) => user[field]))
//     .flat()
//     .filter((token) => token !== undefined && token !== null);
//   // let fcm = removeArrays(fcmToken);
//   const notifications = data.map((user) => {
//     // console.log(user);
//     const title = "New Order";
//     const message = `New Service Order Created`;
//     return {
//       title,
//       message,
//       seen: false,
//       date: new Date(),
//       userId: user._id,
//       orderId: order ? order._id : "",
//       type: "ORDERED",
//       userType: user.userType.includes(userType.superAdmin)
//         ? userType.superAdmin
//         : user.userType?.includes(userType.admin)
//           ? userType.admin
//           : user.userType?.includes(userType.subAdmin)
//             ? userType.subAdmin
//             : userType.partner,
//     };
//   });

//   // Log FCM tokens and send push notifications
//   // console.log("fcmToken", fcmToken);
//   let message1 = {
//     notification: {
//       title: "New Order",
//       body: `New Service Order Created`,
//     },
//     data: {
//       orderId: `${order}` ? `${order._id}` : "",
//       type: "ORDERED",
//     },
//     tokens: fcmToken,
//   };
//   if (fcmToken.length > 0) {
//     sendPushNotification(message1);
//   }

//   // Insert notifications into the database (assuming a bulk insert method)
//   await notificationModel.insertMany(notifications);
// };

// exports.sendNotificationSurviceAdminAndSubAdmin = async (orderId, status) => {
//   // try {
//   // const orderId = req.params.OrderId;
//   // const customerId = req.body.customerId;

//   // // Find the order and customer
//   // const order = orderId
//   //   ? await orderService.findById({ _id: orderId }).populate("customerId")
//   //   : null;
//   // const customer = await userModel.findById(customerId);
//   // console.log(orderId);
//   // console.log(order);
//   // Find admins and sub-admins with FCM tokens
//   const adminSubAdminFilter = {
//     userType: {
//       $in: [
//         userType.admin,
//         userType.subAdmin,
//         userType.superAdmin,
//         userType.partner,
//       ],
//     },
//   };

//   const adminSubAdminFields = [
//     "adminFcmToken",
//     "subAdminFcmToken",
//     "superAdminFcmToken",
//     "partnerFcmToken",
//   ];
//   const data = await userModel.find(adminSubAdminFilter).select("userType");
//   const User = await userModel
//     .find(adminSubAdminFilter)
//     .select(adminSubAdminFields.join(" "));
//   // console.log(User);
//   const fcmToken = User
//     .map((user) => adminSubAdminFields.map((field) => user[field]))
//     .flat()
//     .filter((token) => token !== undefined && token !== null);
//   // let fcm = removeArrays(fcmToken);
//   const notifications = data.map((user) => {
//     // console.log(user);  title: "Order",
//     //   message: `User Is ${status} This Order`,
//     const title = "Service Order";
//     const message = `Order Is ${status} By This ${orderId?.customerId?.fullName}`;
//     return {
//       title,
//       message,
//       seen: false,
//       date: new Date(),
//       userId: user?._id,
//       orderId: orderId?._id,
//       type: "ORDERED",
//       userType: user.userType.includes(userType.superAdmin)
//         ? userType.superAdmin
//         : user.userType?.includes(userType.admin)
//           ? userType.admin
//           : user.userType?.includes(userType.subAdmin)
//             ? userType.subAdmin
//             : userType.partner,
//     };
//   });

//   // Log FCM tokens and send push notifications
//   // console.log("fcmToken", fcmToken);
//   let message1 = {
//     notification: {
//       title: "Service Order",
//       body: `Order Is ${status} By This ${orderId?.customerId?.fullName}`,
//     },
//     data: {
//       orderId: orderId?._id,
//       type: "ORDERED",
//     },
//     tokens: fcmToken,
//   };
//   if (fcmToken.length > 0) {
//     sendPushNotification(message1);
//   }

//   // Insert notifications into the database (assuming a bulk insert method)
//   await notificationModel.insertMany(notifications);

//   //   next();
//   // } catch (error) {
//   //   return res.status(500).json({ success: false, message: error.message });
//   // }
// };

// exports.sendNotificationToCustomer = async ({
//   entity,        // order OR serviceOrder
//   status,        // created / confirmed / completed / cancelled
//   title,         // Notification title
//   message,       // Notification message
//   type,          // ORDERED / SERVICE_BOOKED
// }) => {
//   try {
//     if (!entity || !entity.customerId) return;

//     const fcmToken = [];

//     // Always fetch fresh customer (safe)
//     const customer = await userModel.findById(entity.customerId._id);
//     if (!customer?.customerFcmToken) return;

//     fcmToken.push(customer.customerFcmToken);

//     // 1️⃣ Save in-app notification
//     await notificationModel.create({
//       title,
//       message,
//       seen: false,
//       date: new Date(),
//       userId: entity.customerId._id,
//       orderId: entity._id,
//       type: status,              // status stored
//       userType: "CUSTOMER",
//     });

//     // 2️⃣ Push notification
//     await sendPushNotification({
//       notification: {
//         title,
//         body: message,
//       },
//       data: {
//         orderId: entity._id.toString(),
//         type,                    // ORDERED / SERVICE_BOOKED
//       },
//       tokens: fcmToken,
//     });

//   } catch (error) {
//     console.error("Customer notification error:", error.message);
//   }
// };





// afer Booking send notification to customer
exports.sendNotificationToUserOnServiceBooking = async (
  serviceOrder,
  status,
) => {
  try {

    // console.log(serviceOrder.userId)

    if (!serviceOrder || !serviceOrder.userId) return;

    const fcmToken = [];

    // fresh customer fetch (safe)
    const customer = await userModel.findById(serviceOrder.userId);
    // console.log(customer)
    if (!customer?.customerFcmToken) return;

    fcmToken.push(customer.customerFcmToken);

    //  Save in-app notification
    await notificationModel.create({
      title: `Service Booking ${status}`,
      message: `Your service booking has been ${status} successfully.`,
      seen: false,
      date: new Date(),
      userId: serviceOrder.userId,
      orderId: serviceOrder._id,
      type: status, //  CREATED / CONFIRMED / COMPLETED
      userType: "CUSTOMER",
    });

    //  Push notification
    await sendPushNotification({
      notification: {
        title: `Service Booking ${status}`,
        body: `Your service booking has been ${status} successfully.`,
      },
      data: {
        orderId: serviceOrder._id.toString(),
        type: "SERVICE_BOOKED",
      },
      tokens: fcmToken,
    });

  } catch (error) {
    console.error("Service booking notification error:", error.message);
  }
};


// After order send notification to user
exports.sendNotificationToUserByPartner = async (order, status, partner) => {
  try {
    console.log("Sending notification to customer...");

    const orderData = Array.isArray(order) ? order[0] : order;

    // console.log(orderData, status, partner);

    if (!orderData || !orderData.customerId) {
      return;
    }

    const fcmToken = [];

    const customer = await userModel.findById(orderData.customerId);
    const token = customer?.customerFcmToken;

    if (token) {
      fcmToken.push(token);
      console.log("Customer FCM Token:", token);
    }

    await notificationModel.create({
      title: "Thank You for Your Order",
      message: `Your order has been ${status} successfully.`,
      seen: false,
      date: new Date(),
      userId: orderData.customerId,
      orderId: orderData._id,
      type: status,
      userType: "CUSTOMER",
    });

    if (fcmToken.length > 0) {
      await sendPushNotification({
        notification: {
          title: "Thank You for Your Order",
          body: `Your order has been ${status} successfully.`,
        },
        data: {
          orderId: orderData._id.toString(),
          type: status,
        },
        tokens: fcmToken,
      });
    }
  } catch (error) {
    console.error("Notification error:", error.message);
  }
};


// ============ Send Notification to All Partners on New Order ============ //
const partnerProfileModel = require("../models/partnerProfileModel");

exports.sendNotificationToPartnersOnOrder = async (order) => {
  try {
    const orderData = Array.isArray(order) ? order[0] : order;
    if (!orderData) return;

    // Fetch sub-orders for this master order
    const subOrders = await orderModel.find({ parentOrderId: orderData._id }).lean();

    if (!subOrders || subOrders.length === 0) {
      console.log("No sub-orders found, skipping partner notification.");
      return;
    }

    // Extract unique partnerIds from sub-orders
    const partnerIds = [
      ...new Set(
        subOrders
          .map((subOrder) => subOrder.partnerId?.toString())
          .filter(Boolean)
      ),
    ];

    if (partnerIds.length === 0) {
      console.log("No valid partnerIds found in sub-orders, skipping partner notification.");
      return;
    }

    console.log(`Sending order notification to ${partnerIds.length} partner(s)...`);

    // Fetch partner profiles to get userIds
    const partnerProfiles = await partnerProfileModel
      .find({ _id: { $in: partnerIds } })
      .select("userId name")
      .lean();

    if (!partnerProfiles.length) return;

    const partnerUserIds = partnerProfiles.map((p) => p.userId).filter(Boolean);

    // Fetch users from userModel to get FCM tokens
    const partnerUsers = await userModel
      .find({ _id: { $in: partnerUserIds } })
      .select("customerFcmToken partnerFcmToken fullName")
      .lean();

    const fcmTokens = [];
    const notifications = [];

    for (const profile of partnerProfiles) {
      const user = partnerUsers.find(
        (u) => u._id.toString() === profile.userId?.toString()
      );

      if (!user) continue;

      // Find the specific sub-order for this partner
      const partnerSubOrder = subOrders.find(
        (sub) => sub.partnerId?.toString() === profile._id.toString()
      );

      if (!partnerSubOrder) continue;

      // Count products in this partner's sub-order
      const partnerItemCount = partnerSubOrder.product ? partnerSubOrder.product.length : 0;

      // Create in-app notification for this partner referencing their SPECIFIC sub-order
      notifications.push({
        title: "🛒 New Order Received!",
        message: `You have received a new order with ${partnerItemCount} product(s). Order ID: ${partnerSubOrder.orderId || partnerSubOrder._id}`,
        seen: false,
        date: new Date(),
        userId: user._id,
        orderId: partnerSubOrder._id.toString(),
        type: "ECOM_PARTNER_NEW_ORDER",
        userType: "PARTNER",
      });

      // Pick FCM token from userModel (partnerFcmToken first, fallback to customerFcmToken)
      const token = user.partnerFcmToken || user.customerFcmToken;
      if (token) {
        fcmTokens.push(token);
      }
    }

    // Bulk insert in-app notifications
    if (notifications.length > 0) {
      await notificationModel.insertMany(notifications);
      console.log(`Created ${notifications.length} partner notification(s).`);
    }

    // Send push notifications
    if (fcmTokens.length > 0) {
      await sendPushNotification({
        notification: {
          title: "🛒 New Order Received!",
          body: `You have a new order! Order ID: ${orderData.orderId || orderData._id}`,
        },
        data: {
          orderId: orderData._id.toString(),
          type: "ECOM_PARTNER_NEW_ORDER",
        },
        tokens: fcmTokens,
      });
      console.log(`Sent push notification to ${fcmTokens.length} partner(s).`);
    }
  } catch (error) {
    console.error("Partner order notification error:", error.message);
  }
};


// exports.sendNotificationToPartnerByAdmin = async (order, status) => {
//   // try {
//   let fcmToken = [];
//   let fcmToken1 = [];
//   // let order;
//   // if (req.params.OrderId) {
//   //   order = await orderService
//   //     .findById({ _id: req.params.OrderId })
//   //     .populate("customerId");
//   // }
//   if (order?.customerId?.customerFcmToken !== undefined) {
//     fcmToken.push(order.customerId?.customerFcmToken);
//   }
//   // let User = await userModel.findOne({
//   //   _id: req.params.userId,
//   // });
//   if (order?.partnerId?.partnerFcmToken !== undefined) {
//     fcmToken1.push(order?.partnerId?.partnerFcmToken);
//   }
//   if (order?.partnerId) {
//     await notificationModel.create({
//       title: "New Order",
//       message: `You Assigned This Order Successfully`,
//       seen: false,
//       date: new Date(),
//       userId: order?.partnerId?._id,
//       orderId: order._id,
//       type: "ORDERED",
//       userType: "PARTNER",
//     });
//   }
//   if (order?.customerId) {
//     await notificationModel.create({
//       title: "Your Order",
//       message: `${order?.partnerId?.fullName} Is ${status} Your Order`,
//       seen: false,
//       date: new Date(),
//       userId: order?.customerId._id,
//       orderId: order?._id,
//       type: "ORDERED",
//       userType: "CUSTOMER",
//     });
//   }
//   let message2 = {
//     notification: {
//       title: "New Order",
//       body: `You Assigned This Order Successfully`,
//     },
//     data: {
//       orderId: `${order._id}`,
//       type: "ORDERED",
//     },
//     tokens: fcmToken1,
//   };
//   let message1 = {
//     notification: {
//       title: "Your Order",
//       body: `${Partner} Is ${status} Your Order`,
//     },
//     data: {
//       orderId: `${order._id}`,
//       type: "ORDERED",
//     },
//     tokens: fcmToken,
//   };
//   if (fcmToken1.length > 0) {
//     sendPushNotification(message2);
//   }
//   if (fcmToken.length > 0) {
//     sendPushNotification(message1);
//   }

//   //   next();
//   // } catch (error) {
//   //   return res.status(500).json({ success: false, message: error.message });
//   // }
// };

// exports.sendNotificationCancleStatusByAdmin = async (order, status) => {
//   // try {
//   let fcmToken = [];
//   // let order;
//   // if (req.params.OrderId) {
//   //   order = await orderService
//   //     .findById({ _id: req.params.OrderId })
//   //     .populate("customerId");
//   // }
//   if (order?.customerId?.customerFcmToken !== undefined) {
//     fcmToken.push(order?.customerId?.customerFcmToken);
//   }

//   await notificationModel.create({
//     title: "Your Order",
//     message: `Your Order Is Successfully ${status}`,
//     seen: false,
//     date: new Date(),
//     userId: order?.customerId?._id,
//     orderId: order?._id,
//     type: "ORDERED",
//     userType: "CUSTOMER",
//   });
//   let message1 = {
//     notification: {
//       title: "Your Order",
//       body: `Your Order Is Successfully ${status}`,
//     },
//     data: {
//       orderId: `${order?._id}`,
//       type: "ORDERED",
//     },
//     tokens: fcmToken,
//   };
//   if (fcmToken.length > 0) {
//     sendPushNotification(message1);
//   }
//   //   next();
//   // } catch (error) {
//   //   return res.status(500).json({ success: false, message: error.message });
//   // }
// };

exports.seenCount = async (req, res) => {
  try {
    let obj = {};
    if (req.query.userType) {
      obj.userType = req.query.userType;
    }
    if (req.params.userId) {
      obj.userId = req.params.userId;
    }
    obj.seen = false;
    let check = await notificationModel.find(obj);
    // if (!check.length) {
    //   return res
    //     .status(404)
    //     .json({ success: false, message: "Notification not found..." });
    // }
    return res.status(200).json({
      success: true,
      message: "Notification Fatch Successfully...",
      count: check.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};



exports.getAllNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalNotifications = await notificationModel.countDocuments();
    const totalPages = Math.ceil(totalNotifications / limit);

    const notifications = await notificationModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      data: notifications,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalNotifications: totalNotifications,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ============ Specific Notifications for Vendor Actions (Accept, Reject, Complete) ============ //

exports.sendVendorAcceptNotification = async ({ userId, orderId, isService }) => {
  try {
    let fcmTokens = [];
    const user = await userModel.findById(userId).select("customerFcmToken");
    if (user && user.customerFcmToken) fcmTokens.push(user.customerFcmToken);

    const title = "Order Confirmed";
    const message = isService 
      ? "Your booking for this service is confirmed" 
      : "Your order of this product is confirmed";

    await notificationModel.create({
      title, message, seen: false, date: new Date(),
      orderId, userId, userType: "CUSTOMER",
      type: isService ? "SERVICE_BOOKED" : "ECOM_ORDERED",
    });

    if (fcmTokens.length > 0) {
      await sendPushNotification({
        notification: { title, body: message },
        data: { type: isService ? "SERVICE_BOOKED" : "ECOM_ORDERED", orderId: String(orderId) },
        tokens: fcmTokens,
      });
    }
  } catch (error) { console.error("Accept notification error:", error.message); }
};

exports.sendVendorRejectNotification = async ({ userId, orderId, isService }) => {
  try {
    let fcmTokens = [];
    const user = await userModel.findById(userId).select("customerFcmToken");
    if (user && user.customerFcmToken) fcmTokens.push(user.customerFcmToken);

    const title = "Order Rejected";
    const message = isService 
      ? "Unfortunately, your booking for this service has been rejected by the vendor." 
      : "Unfortunately, your order of this product has been rejected by the vendor.";

    await notificationModel.create({
      title, message, seen: false, date: new Date(),
      orderId, userId, userType: "CUSTOMER",
      type: isService ? "SERVICE_BOOKED" : "ECOM_ORDERED",
    });

    if (fcmTokens.length > 0) {
      await sendPushNotification({
        notification: { title, body: message },
        data: { type: isService ? "SERVICE_BOOKED" : "ECOM_ORDERED", orderId: String(orderId) },
        tokens: fcmTokens,
      });
    }
  } catch (error) { console.error("Reject notification error:", error.message); }
};

exports.sendVendorCompleteNotification = async ({ userId, orderId, isService }) => {
  try {
    let fcmTokens = [];
    const user = await userModel.findById(userId).select("customerFcmToken");
    if (user && user.customerFcmToken) fcmTokens.push(user.customerFcmToken);

    const title = "Order Completed";
    const message = isService 
      ? "Your service booking has been completed successfully. Thank you for choosing us!" 
      : "Your order has been completed successfully. Thank you for shopping with us!";

    await notificationModel.create({
      title, message, seen: false, date: new Date(),
      orderId, userId, userType: "CUSTOMER",
      type: isService ? "SERVICE_BOOKED" : "ECOM_ORDERED",
    });

    if (fcmTokens.length > 0) {
      await sendPushNotification({
        notification: { title, body: message },
        data: { type: isService ? "SERVICE_BOOKED" : "ECOM_ORDERED", orderId: String(orderId) },
        tokens: fcmTokens,
      });
    }
  } catch (error) { console.error("Complete notification error:", error.message); }
};

// ============ Specific Notification for Single Product Accept ============ //
exports.sendNotificationProductAccepted = async ({ userId, orderId, productTitle }) => {
  try {
    let fcmTokens = [];
    const user = await userModel.findById(userId).select("customerFcmToken");
    if (user && user.customerFcmToken) fcmTokens.push(user.customerFcmToken);

    const title = "Order Confirmed 🎉";
    const message = `Your order has been confirmed for this product: ${productTitle}`;

    await notificationModel.create({
      title, message, seen: false, date: new Date(),
      orderId, userId, userType: "CUSTOMER",
      type: "ECOM_ORDERED",
    });

    if (fcmTokens.length > 0) {
      await sendPushNotification({
        notification: { title, body: message },
        data: { type: "ECOM_ORDERED", orderId: String(orderId) },
        tokens: fcmTokens,
      });
    }
  } catch (error) { console.error("Product Accept notification error:", error.message); }
};