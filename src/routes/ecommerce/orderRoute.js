const controller = require("../../controllers/ecommerce/orderController");
const express = require("express");
const router = express.Router();
const { getUserId } = require("../../midellwares/userMidellware");
const { adminRoute } = require("../../midellwares/auth");
const { date } = require("../../midellwares/datefilter");
const { isOrder } = require("../../midellwares/PermissionMidellware");
const { billDetailEcommerce } = require("../../midellwares/billDetail");
const {userRoute, partnerRoute} = require("../../midellwares/auth");

const {
  sendNotificationAdminAndSubAdmin,
  sendNotificationUserOnStatusUpdate,
} = require("../../controllers/notificationController");

router.param("customerId", getUserId);
router.param("orderId", controller.getOrderId);
router.param("adminId", adminRoute);

// ================== Post ===============
router.post(
  "/eCommerce/createOrder", //done
  userRoute,
  billDetailEcommerce,
  controller.createOrder
);

router.post("/eCommerce/order/verify-payment", controller.verifyPayment); //done

// ============= Get ================
router.get("/eCommerce/getByOrderId/:orderId", controller.getByOrderId); //done
router.get(
  "/eCommerce/getOrderByCustomerId/:customerId",    //done
  controller.getOrderByCustomerId
);

// ================== Put ===============
router.put(
  "/eCommerce/cancelOrder/:orderId",       // done
  userRoute,
  // sendNotificationAdminAndSubAdmin,
  controller.cancelOrder
);

// ================ Partner ===============
router.get(
  "/eCommerce/partner/getOrders",
  partnerRoute,
  controller.getOrdersByPartner
);
router.get(
  "/eCommerce/partner/getOrderDetail/:orderId",
  partnerRoute,
  controller.getOrderDetailByPartner
);
router.put(
  "/eCommerce/partner/updateStatus/:orderId",
  partnerRoute,
  controller.updatePartnerOrderStatus
);

router.put(
  "/eCommerce/returnRequestOrde/:orderId",    // done
  // sendNotificationAdminAndSubAdmin,
  controller.returnRequestOrder
);

router.put(
  "/eCommerce/updateTransitionId/:orderId",
  controller.updateTransitionId
);

// ================ Admin ===============


// =========== Put ============

router.put(
  "/eCommerce/updateAllProductStatus/:orderId/:adminId", //done
  isOrder,
  // sendNotificationUserOnStatusUpdate,
  controller.updateAllProductStatus
);

router.put(
  "/eCommerce/updateSingleStatus/:orderId/:adminId",  // done
  isOrder,
  // sendNotificationUserOnStatusUpdate,
  controller.updateSingleStatus
);

// router.put(
//   "/eCommerce/updateSingleStatus/:orderId",
//   controller.updateSingleStatus
// );

router.get(
  "/eCommerce/admin/getAllOrdersWithSubs/:adminId",
  isOrder,
  controller.getAllOrdersForAdmin
);

router.get(
  "/eCommerce/filterOrderByDate/:adminId",   // done
  isOrder,
  date,
  controller.filterOrderByDate
);

router.get(
  "/eCommerce/getByOrderId/:orderId/:adminId", //done
  controller.getByOrderId
);
module.exports = router;
