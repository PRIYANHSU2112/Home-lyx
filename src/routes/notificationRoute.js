const controller = require("../controllers/notificationController");
const express = require("express");
const router = express.Router();


// router.get("/test-fcm", controller.testFcmNotification);

router.post("/sendNotificationToSingleUser",controller.sendNotificationToSingleUser) //done
router.post("/sendNotificationToAllUser",controller.sendNotificationToAllUser)    // done
router.get("/getByNotificationId/:notificationId",controller.getByNotificationId)  //
router.get("/getByUserId/:userId",controller.getByUserId)
router.get("/seenCount/:userId",controller.seenCount)
router.get("/getAllNotifications",controller.getAllNotifications)



module.exports = router;
