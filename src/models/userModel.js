const mongoose = require("mongoose");
const { userPermissions } = require("../helper/userPermission");
const { userType } = require("../helper/userType");
let objectId = mongoose.Types.ObjectId;

const userModel = new mongoose.Schema(
  {
    image: {
      type: String,
      default: null,
    },
    fullName: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    phoneNumber: {
      type: Number,
    },
    email: {
      type: String,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      uppercase : true
    },
    password: {
      type: String,
      trim: true,
    },
    userType: {
      type: [{ type: String, enum: Object.values(userType) }],
      default: [userType.customer],
    },
    permissions: {
      type: [{ type: String, enum: Object.values(userPermissions) }],
      default: [userPermissions.none],
    },
    // membership: {
    //   membershipId: {
    //     type: objectId,
    //     default: null,
    //   },
    //   title: String,
    //   logo: String,
    //   features: [String],
    //   durationInMonth: Number,
    //   discountPercent: { type: Number },
    //   startDate: Date,
    //   endDate: Date,
    // },
    customerFcmToken: String,
    adminFcmToken: String,
    // superAdminFcmToken: String,
    subAdminFcmToken: String,
    // partnerFcmToken: String,
    disable: {
      type: Boolean,
      default: false,
    },
    otp:{
      type:String,
    },

wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "eCommerceProductModel",
      default: [],
    },
  ],



  },
  { timestamps: true }
);
userModel.index({ email: 1 }, { unique: true, sparse: true });
userModel.index({ phoneNumber: 1 }, { unique: true, sparse: true });
userModel.index({ userType: 1 });
userModel.index({ disable: 1 });

module.exports = mongoose.model("userModel", userModel);
