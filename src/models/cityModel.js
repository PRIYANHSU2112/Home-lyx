const mongoose = require("mongoose");
const cityModel = new mongoose.Schema(
  {
    cityName: String,
    cityId: Number,
    disable: { type: Boolean, default: false },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
  },
  { timestamps: true }
);

cityModel.index({ location: "2dsphere" });

module.exports = mongoose.model("cityModel", cityModel);
