const express  = require("express");
const router = express.Router();

const  controller = require("../controllers/refundController");
const {optional, adminMRoute, userRoute}  = require("../midellwares/auth")

router.get("/getCancleOrderAndService", optional, controller.getCancelledPaidOrdersAndBookings);

router.post("/requestRefund", optional, controller.createRefundRequest);

router.get("/getAllrefunds", userRoute, controller.getMyRefundRequests);

// Admin routes
router.get("/admin/refunds", adminMRoute , controller.getAllRefundRequests);

router.put("/admin/refunds/:refundId", adminMRoute, controller.updateRefundStatusByAdmin);


module.exports = router;