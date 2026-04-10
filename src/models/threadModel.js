const mongoose = require("mongoose");

const threadModel = new mongoose.Schema(
  {
    userId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userModel",
      },
    ],
    userType: { type: String, enum: ["USER", "PARTNER"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("threadModel", threadModel);
