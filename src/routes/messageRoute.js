const controller = require("../controllers/messageController");
const express = require("express");
const { upload } = require("../midellwares/multerMidellware");
const router = express.Router();

router.post("/createMessage", upload.single("image"),controller.createMessage);
router.get("/getChatFromThreadId/:threadId", controller.getChatFromThreadId);
router.get("/getYourThreadId/:userId", controller.getYourThreadId);
router.get("/getAllChatByAdmin", controller.getAllChatByAdmin);
module.exports = router;
