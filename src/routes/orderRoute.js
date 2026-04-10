const express = require("express");
const router = express.Router();
const controller = require("../controllers/orderController");
const midellwares = require("../midellwares/datefilter");
const Midellwares = require("../midellwares/userMidellware");
const { dashBoard } = require("../controllers/dashBoard");
const { adminRoute } = require("../midellwares/auth");
const { isOrder } = require("../midellwares/PermissionMidellware");

const { upload } = require("../midellwares/multerMidellware");
// ================ Midellwares ============
router.param("userId", Midellwares.getUserId);
router.param("OrderId", controller.getOrderId);
router.param("adminId", adminRoute);

// ================ Post ===============

router.post("/createOrder", controller.createOrder);

// =============== get ============
router.get(
  "/getAllOrderByCostomerId/:userId",
  controller.getAllOrderByCostomerId
);

// ================ Put ============
router.put(
  "/cancelOrder/:OrderId/:userId",
  // sendNotificationSurviceAdminAndSubAdmin,
  controller.cancelOrder
);
router.put("/updateTransactionId/:OrderId", controller.updateTransactionId);
router.put(
  "/updateCompletedStatus/:OrderId/:userId",
  upload.fields([{ name: "afterWorkingImage" }]),
  // sendNotificationToUserByPartner,
  controller.updateCompletedStatus
);
router.put(
  "/updateWorkingStatus/:OrderId/:userId",
  upload.fields([{ name: "beforeWorkingImage" }]),
  // sendNotificationToUserByPartner,
  controller.updateWorkingStatus
);
router.put(
  "/onTheWayStatusUpdate/:OrderId/:userId",
  // sendNotificationToUserByPartner,
  controller.onTheWayStatusUpdate
);
router.put(
  "/acceptedStatusUpdate/:OrderId/:userId",
  // sendNotificationToUserByPartner,
  controller.acceptedStatusUpdate
);

// ============= Get ===========
router.get("/getOrderByOrderId/:OrderId", controller.getOrderByOrderId);
router.get("/getOrderByPartnerId/:userId", controller.getOrderByPartnerId);
router.get(
  "/getAllOrderByPartnerId/:partnerId",
  controller.getAllOrderByPartnerId
);
router.get("/getAllOrderByCity", controller.getAllOrderByCity); //pending
router.get("/orderDashboardOfPatner", controller.orderDashboardOfPatner);
router.get(
  "/getPartnerCompletedOrder/:partnerId",
  controller.getPartnerCompletedOrder
);
// ============== admin ==============
router.post(
  "/createOrderByAdmin/:adminId",
  isOrder,
  controller.createOrderByAdmin
);

router.get(
  "/filterOrderByDate/:adminId",
  isOrder,
  midellwares.date,
  controller.filterOrderByDate
);

router.put(
  "/cancelOrderByAdmin/:OrderId/:adminId",
  isOrder,
  // sendNotificationCancleStatusByAdmin,
  controller.cancelOrder
);

router.put(
  "/assignePartnerByAdmin/:OrderId/:userId/:adminId",
  isOrder,
  // sendNotificationToPartnerByAdmin,
  controller.AssignePartnerByAdmin
);

router.get("/dashBoard/:adminId",
  //  isOrder,
    dashBoard);

router.get(
  "/getOrderByOrderId/:OrderId/:adminId",
  controller.getOrderByOrderId
);
module.exports = router;
