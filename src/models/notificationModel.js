const mongoose = require("mongoose");
const notificationModel = new mongoose.Schema(
  {
    title: String,
    message: String,
    icon: String,
    seen: {
      type: Boolean,
      default: false,
    },
    date: Date,
    orderId: String,
    userId: { type: mongoose.Types.ObjectId, ref: "userModel" },
	  chatUserId: { type: mongoose.Types.ObjectId, ref: "userModel" },
	  threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "threadModel",
    },
    userType: String,
    type: String,
  },
  { timestamps: true }
);
notificationModel.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
module.exports = mongoose.model("notificationModel", notificationModel);
