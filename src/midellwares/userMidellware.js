const userModel = require("../models/userModel");
const partnerProfileModel = require("../models/partnerProfileModel");
const jwt = require("jsonwebtoken");
function validateMobileNumber(number) {
  const regex = /^[0-9]{10}$/;
  return regex.test(number);
}
const { userPermissions } = require("../helper/userPermission");
const userTypes = require("../helper/userType");

// ========================== Get Id =================================== ||

exports.getUserId = async (req, res, next, id) => {
  try {
    let User = await userModel.findById(id);
    if (!User) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    } else {
      let partnerProfile = await partnerProfileModel.findOne({
        userId: User._id,
      });
      (req.check = !partnerProfile
        ? false
        : partnerProfile.idDocument.profileVerificetionCompleted),
        (req.selfieStatus = !partnerProfile
          ? false
          : partnerProfile.selfie.status);
      req.addharStatus = !partnerProfile
        ? false
        : partnerProfile.idDocument.status;
      req.User = User;
      next();
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Get User Customer =================================== ||

exports.getUserCustomer = async (req, res, next) => {
  try {
    const { phoneNumber, hashKey, email } = req.body;
    if (!phoneNumber) {
      return res.status(400).send({
        success: false,
        message: "phoneNumber Is Required....",
      });
    }
    if (!validateMobileNumber(phoneNumber)) {
      return res.status(400).send({
        success: false,
        message: "please provide valid 10 digit number",
      });
    }
    if (!hashKey) {
      return res.status(400).send({
        success: false,
        message: "hashKey Is Required....",
      });
    }
    if (process.env.hash_Key.toString() !== hashKey) {
      return res
        .status(400)
        .send({ success: false, message: "hashKey is not valid" });
    }
    let User = await userModel.findOne({ phoneNumber: phoneNumber });
    if (!User) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    } else {
      if (email) {
        await userModel.findOneAndUpdate(
          { phoneNumber: phoneNumber },
          { $set: { email: email } },
          { new: true }
        );
      }

      if (req.body.customerFcmToken) {
        await userModel.findOneAndUpdate(
          { phoneNumber: phoneNumber },
          { $set: { customerFcmToken: req.body.customerFcmToken } },
          { new: true }
        );
      }
      if (!User.userType.includes("CUSTOMER")) {
        User.userType.push("CUSTOMER");
        let user = await userModel.findOneAndUpdate(
          { phoneNumber: phoneNumber },
          { $set: { userType: User.userType } },
          { new: true }
        );
        req.user = user;
        next();
      } else {
        req.user = User;
        next();
      }
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Get User Partner =================================== ||

exports.getUserPartner = async (req, res, next) => {
  try {
    const { fullName, phoneNumber, disable, userType, permissions, hashKey } =
      req.body;
    if (!phoneNumber) {
      return res.status(400).send({
        success: false,
        message: "phoneNumber Is Required....",
      });
    }
    if (!validateMobileNumber(phoneNumber)) {
      return res.status(400).send({
        success: false,
        message: "please provide valid 10 digit number",
      });
    }
    if (!hashKey) {
      return res.status(400).send({
        success: false,
        message: "hashKey Is Required....",
      });
    }
    if (process.env.hash_Key.toString() !== hashKey) {
      return res
        .status(400)
        .send({ success: false, message: "hashKey is not valid" });
    }

    let User = await userModel.findOne({ phoneNumber: phoneNumber });
    if (!User) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    } else {
      let check = await partnerProfileModel.findOne({ userId: User._id });
      if (req.body.partnerFcmToken) {
        await userModel.findOneAndUpdate(
          { phoneNumber: phoneNumber },
          { $set: { partnerFcmToken: req.body.partnerFcmToken } },
          { new: true }
        );
      }
      if (!User.userType.includes("PARTNER")) {
        User.userType.push("PARTNER");
        let user = await userModel.findOneAndUpdate(
          { phoneNumber: phoneNumber },
          { $set: { userType: User.userType } },
          { new: true }
        );
        (req.check = !check
          ? false
          : check.idDocument.profileVerificetionCompleted),
          (req.user = user);
        next();
      } else {
        (req.check = !check
          ? false
          : check.idDocument.profileVerificetionCompleted),
          (req.user = User);
        next();
      }
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
