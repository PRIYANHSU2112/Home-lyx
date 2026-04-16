const controller = require("../controllers/notificationController");
const express = require("express");
const router = express.Router();
const { partnerRoute } = require("../midellwares/auth");


// router.get("/test-fcm", controller.testFcmNotification);

router.post("/sendNotificationToSingleUser",controller.sendNotificationToSingleUser) //done
router.post("/sendNotificationToAllUser",controller.sendNotificationToAllUser)    // done
router.post("/sendNotificationToAllPartner",controller.sendNotificationToAllPartners) 
router.post("/sendNotificationToSinglePartner",controller.sendNotificationToSinglePartner) 
router.get("/getByNotificationId/:notificationId",controller.getByNotificationId)  //


router.get("/getByUserId/:userId",controller.getByUserId)
router.get("/seenCount/:userId",controller.seenCount)
router.get("/getAllNotifications",controller.getAllNotifications)

// ================== Partner Route ================== //
router.get("/getPartnerNotifications", partnerRoute, controller.getPartnerNotifications);

module.exports = router;

