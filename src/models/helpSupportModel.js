const mongoose = require("mongoose");

const helpAndSupportSchema = new mongoose.Schema({
  heading: {
    type: String,
    trim: true,
    uppercase: true,
  },
  description: {
    type: String,
  },

  diasble: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("help&support", helpAndSupportSchema);
