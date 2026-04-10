const { timestamp } = require("joi/lib/types/date");
const mongoose = require("mongoose");

const messageModel = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
    },
    message: String,
    image: String,
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "threadModel",
    },
    userType: { type: String, enum: ["USER", "PARTNER"] },
    messageType: { type: String, enum: ["USER","ADMIN"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("messageModel", messageModel);
