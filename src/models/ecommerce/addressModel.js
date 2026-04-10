const mongoose = require("mongoose");
let objectId = mongoose.Types.ObjectId;
const addressModel = mongoose.Schema({
  firstName: String,
  lastName: String,
  mobile: Number,
  customerId: { type: objectId, ref: "userModel" },
  address: String,
  apartment: String,
  landmark: String,
  area: String,
  city: String,
  pinCode:Number,
  latitude:Number,
  longitude:Number,
  state:String,
  country:String,
  addressType: {
  type: String,
  enum: ["HOME", "OFFICE"],
  default: "HOME"
}
},
{ timestamps: true });

// Add indexes for better query performance
addressModel.index({ customerId: 1 });
addressModel.index({ customerId: 1, addressType: 1 });
addressModel.index({ city: 1 });
addressModel.index({ createdAt: -1 });

module.exports = mongoose.model("addressmodel", addressModel);

