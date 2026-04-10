const mongoose = require("mongoose");

const questionModel = new mongoose.Schema(
  {
    question: String,
    answer: String,
    disable: {
      type: Boolean,
      default: false,
    },
    userType: { type: String, enum: ["USER", "PARTNER"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("questionModel", questionModel);
