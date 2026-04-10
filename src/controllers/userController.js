const userModel = require("../models/userModel");
const cartModel = require("../models/cartModel");
const CartModel = require("../models/ecommerce/CartModel");
const otpGenerator = require("otp-generator");
const partnerProfileModel = require("../models/partnerProfileModel");



const jwt = require("jsonwebtoken");
const http = require("http");
const membershipModel = require("../models/memberShipModel");
const { userPermissions } = require("../helper/userPermission");
const userTypes = require("../helper/userType");
const bcrypt = require("bcrypt");

// ======================== Mobile Number Validete ========================== ||

function validateMobileNumber(number) {
  const regex = /^[0-9]{10}$/;
  return regex.test(number);
}

// =========================== Send Otp Function ============================== ||

const sendOtpFunction = (mobile, otp) => {
  const options = {
    method: "POST",
    hostname: "api.msg91.com",
    port: null,
    path: "/api/v5/flow/",
    headers: {
      authkey: "384292AwWekgBJSf635f77feP1",
      "content-type": "application/json",
    },
  };

  const req = http.request(options, function (res) {
    const chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      const body = Buffer.concat(chunks);
      console.log(body.toString());
    });
  });

  req.write(
    `{\n  \"flow_id\": \"63614b3dabf10640e61fa856\",\n  \"sender\": \"Home Service\",\n  \"mobiles\": \"91${mobile}\",\n  \"otp\": \"${otp}\"\n}`
  );
  req.end();
};

// ===================== Otp Generator ====================== ||

const otp = () => {
  let o = Number(
    otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    })
  );
  return o;
};

// =================== Register ====================== ||

exports.register = async (req, res) => {
  try {
    const { fullName, phoneNumber, hashKey, customerId, userType, email } =
      req.body;
    if (!fullName) {
      return res
        .status(400)
        .send({ success: false, message: "Enter Your Full Name" });
    }
    if (!phoneNumber) {
      return res
        .status(400)
        .send({ success: false, message: "Enter Your Phone Number" });
    }
    if (!validateMobileNumber(phoneNumber)) {
      return res.status(400).send({
        success: false,
        message: "please provide valid 10 digit number",
      });
    }
    const check = await userModel.findOne({ phoneNumber: phoneNumber });
    if (check) {
      return res
        .status(400)
        .json({ success: false, message: "Mobile Number Is Already Exsist.." });
    }
    // if (userType && !Object.values(userTypes.userType).includes(userType)) {
    //   return res.status(400).json({
    //     success: false,
    //     message:
    //       "Only This Type Of UserType (ADMIN && SUB_ADMIN && CUSTOMER && PARTNER)",
    //   });
    // }
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
    let userdata = await userModel.create({
      // image: req.file ? req.file.key : null,,
      userType: userType,
      fullName: fullName,
      phoneNumber: phoneNumber,
      customerFcmToken: req.body.customerFcmToken,
      email: email,
    });
    if (customerId) {
      await cartModel.updateMany(
        { customerId: customerId },
        { $set: { customerId: userdata._id } },
        { new: true }
      );
      await CartModel.updateMany(
        { customerId: customerId },
        { $set: { customerId: userdata._id } },
        { new: true }
      );
    }
    const generate = await jwt.sign({ User: userdata._id }, "SECRETEKEY", {
      expiresIn: "365d",
    });
    userdata._doc.token = generate;
    return res.status(201).send({
      success: true,
      message: "Register Successfully",
      data: userdata,
      check: false,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// // ====================== log In ========================= ||

// exports.login = async (req, res) => {
//   try {
//     if (req.user.disable == true) {
//       return res.status(400).json({
//         success: false,
//         message: "User Is Ban..",
//       });
//     }
//     const generate = await jwt.sign({ User: req.user._id }, "SECRETEKEY", {
//       expiresIn: "7d",
//     });
//     if (req.body.customerId) {
//       await cartModel.updateMany(
//         { customerId: req.body.customerId },
//         { $set: { customerId: req.user._id } },
//         { new: true }
//       );
//       await CartModel.updateMany(
//         { customerId: req.body.customerId },
//         { $set: { customerId: req.user._id } },
//         { new: true }
//       );
//     }
//     // console.log(req.body.customerFcmToken);
//     // let user = req.user;
//     req.user._doc.token = generate;
//     return res.status(200).send({
//       success: true,
//       message: "User Successfully Login...",
//       data: req.user,
//       check: req.check,
//     });
//   } catch (error) {
//     return res.status(500).send({ success: false, message: error.message });
//   }
// };


exports.login = async (req, res) => {
  try {
    const {
      phoneNumber,
      email,
      otp,
      guestId,
      userType,
      customerFcmToken,
    } = req.body;


    if (!phoneNumber || !email) {
      return res.status(400).json({
        success: false,
        message: "Phone number or email is required",
      });
    }



    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }


    if (phoneNumber && !validateMobileNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid 10 digit number",
      });
    }


    let user = await userModel.findOne({
      $and: [
        phoneNumber ? { phoneNumber } : null,
        email ? { email } : null,
      ].filter(Boolean),
    });

    let isNewUser = false;

    //  If user not exist → CREATE (register)
    if (!user) {
       return res.status(404).json({
         success: false,
        message: "User not found",
       })
    }



    //  OTP verification
    console.log(otp)
    console.log("user" + user.otp);
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (user.otpExpireAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    //  Clear OTP after success
    user.otp = null;
    user.otpExpireAt = null;

    //  Update FCM token (latest device)
    if (customerFcmToken) {
      user.customerFcmToken = customerFcmToken;
    }

    //  Ban check
    if (user.disable === true) {
      return res.status(403).json({
        success: false,
        message: "User is banned",
      });
    }

    await user.save();

    // Guest cart merge
    if (guestId) {
      await cartModel.updateMany(
        { guestId },
        { $set: { customerId: user._id, guestId: null } }
      );
      await CartModel.updateMany(
        { guestId },
        { $set: { customerId: user._id, guestId: null } }
      );
    }

    // 1️⃣1️⃣ JWT token
    const token = jwt.sign(
      { User: user._id },
      "SECRETEKEY",
      { expiresIn: "56d" }
    );

    user._doc.token = token;

    return res.status(200).json({
      success: true,
      message: isNewUser
        ? "User registered & logged in successfully"
        : "User logged in successfully",
      data: user,
      isNewUser,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================== Get By Id ======================== ||

exports.getUserById = async (req, res) => {
  try {
    return res.status(200).send({
      success: true,
      message: "User Is Fetched Successfully...",
      data: req.User,
      check: req.check,
      selfieStatus: req.selfieStatus,
      addharStatus: req.addharStatus,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ======================== Get All User ======================== ||

exports.getAllUser = async (req, res) => {
  try {

    let { search, disable, page = 1, limit = 20, userType } = req.query;

    const pageNumber = Number(page);
    const pageLimit = Number(limit);
    const skip = (pageNumber - 1) * pageLimit;

    let query = {};

    if (Array.isArray(search)) {
      search = search[search.length - 1];
    }

    if (search) {
      if (search.length === 10 && !isNaN(search)) {
        query.phoneNumber = Number(search);
      } else {
        query.$or = [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ];
      }
    }

    if (userType && Object.values(userTypes.userType).includes(userType)) {
      query.userType = userType;
    }

    if (disable !== undefined) {
      query.disable = disable === "true";
    }

    const totalUsers = await userModel.countDocuments(query);

    const users = await userModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
      totalPages: Math.ceil(totalUsers / pageLimit),
      currentPage: pageNumber,
      limit: pageLimit,
      totalUsers,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================= Send Otp =========================== ||

exports.sendOtp = async (req, res) => {
  try {
    const { phoneNumber, email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "email is required",
      });
    }
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone Number is required",
      });
    }



    if (!validateMobileNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }


    // single DB call
    let user = await userModel.findOne({
      $or: [
        { phoneNumber },
        ...(email ? [{ email }] : [])
      ]
    });

    if (
      user &&
      user.phoneNumber === phoneNumber &&
      email &&
      user.email &&
      user.email !== email
    ) {
      return res.status(409).json({
        success: false,
        message: "Phone number already linked with another email"
      });
    }

    if (
      user &&
      email &&
      user.email === email &&
      user.phoneNumber !== phoneNumber
    ) {
      return res.status(409).json({
        success: false,
        message: "Email already linked with another phone number"
      });
    }

    // console.log(user)

    const generatedOtp = otp(); // random OTP
    // const generatedOtp = 1234;
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    if (!user) {
      user = await userModel.create({
        phoneNumber,
        email,
        otp: generatedOtp,
        otpExpireAt: expiry,
      });
    } else {
      //  If user exists → update OTP
      user.otp = generatedOtp;
      user.otpExpireAt = expiry;
      await user.save();
    }
    sendOtpFunction(phoneNumber, generatedOtp);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,

    });
  }
};

exports.partnerLogin = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    if (!validateMobileNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    let user = await userModel.findOne({ phoneNumber });

    // const generatedOtp = otp();
    const generatedOtp = 1234;
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    if (!user) {
      user = await userModel.create({
        phoneNumber,
        otp: generatedOtp,
        otpExpireAt: expiry,
        userType: userTypes.userType.partner,
      });
    } else {
      user.otp = generatedOtp;
      user.otpExpireAt = expiry;
      await user.save();
    }

    // await sendOtpFunction(phoneNumber, generatedOtp);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.partnerVerify = async (req, res) => {
  try {
    const { phoneNumber, otp, customerFcmToken } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    if (!validateMobileNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10 digit number",
      });
    }

    const user = await userModel.findOne({
      phoneNumber,
      userType: userTypes.userType.partner,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.disable === true) {
      return res.status(403).json({
        success: false,
        message: "User is banned",
      });
    }

    /* ---------- OTP CHECKS ---------- */
    if (!user.otp || user.otpExpireAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    /* ---------- CLEAR OTP + UPDATE FCM ---------- */
    user.otp = null;
    user.otpExpireAt = null;

    if (customerFcmToken) {
      user.customerFcmToken = customerFcmToken;
    }

    await user.save();

    const partnerProfile = await partnerProfileModel.findOne({ userId: user._id });

    /* ---------- JWT ---------- */
    const token = jwt.sign(
      { User: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "56d" }
    );

    user._doc.token = token;

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: user,
      partnerProfile: partnerProfile
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// =================== Log Out ===================== ||

exports.logOut = async (req, res) => {
  try {
    res.clearCookie("authorization");
    res
      .status(200)
      .json({ success: true, message: "Successfully Logout Your Account" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================= Update User ========================== ||

// exports.updateUser = async (req, res) => {
//   try {
//     function calculateNewDate(originalDate, numMonths) {
//       const [year, month, day] = originalDate.split("-");
//       const originalDateObj = new Date(year, month - 1, day);
//       const newDateObj = new Date(originalDateObj);
//       newDateObj.setMonth(newDateObj.getMonth() + numMonths);
//       while (newDateObj.getDate() !== originalDateObj.getDate()) {
//         newDateObj.setDate(newDateObj.getDate() - 1);
//       }
//       const newDateStr = newDateObj.toISOString();
//       return newDateStr;
//     }
//     const { fullName, membershipId, permissions, email, password } = req.body;
//     if (req.User.permissions && permissions) {
//       if (req.User.permissions.includes("NONE")) {
//         req.User.permissions.splice(0, 1);
//       }
//       // if (!req.User.permissions.includes(permissions)) {
//       //   req.User.permissions.push(permissions);
//       // }
//     }
//     let obj = {};
//     if (membershipId) {
//       let startDate = new Date();
//       let memberShip = await membershipModel.findById(membershipId);
//       const startDateStr = startDate.toISOString().slice(0, 10);
//       const newDate = calculateNewDate(
//         startDateStr,
//         memberShip.durationInMonth
//       );
//       obj.membershipId = membershipId;
//       obj.logo = memberShip.logo;
//       obj.features = memberShip.features;
//       obj.durationInMonth = memberShip.durationInMonth;
//       obj.discountPercent = memberShip.discountPercent;
//       obj.startDate = startDateStr;
//       obj.endDate = newDate;
//       obj.title = memberShip.title;
//     }
//     // console.log("dfkldkfdf");
//     let hash;
//     if (password) {
//       hash = bcrypt.hashSync(password, 8);
//     }
//     // console.log(hash);
// 	   const check = await userModel.findOne({ email: email });
//     // console.log(check && req.User._id != check._id,"ffddf",req.User._id,"tyty",check._id);
//     if (email && check && req.User._id.toString() !== check._id.toString()) {
//       return res.status(400).json({
//         success: false,
//         message: "please Provide Unique email",
//       });
//     }
//     const UpdateUser = await userModel.findByIdAndUpdate(
//       { _id: req.User._id },
//       {
//         $set: {
//           image: req.file ? req.file.key : req.User.image,
//           fullName: fullName,
//           email: email,
//           permissions: permissions,
//           password: hash ? hash : req.User.password,
//           membership: membershipId ? obj : req.User.membership,
//         },
//       },
//       { new: true }
//     );
//     return res.status(200).json({
//       success: true,
//       message: "User Is Update Successfully...",
//       data: UpdateUser,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };


exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, email, gender, dateOfBirth } = req.body;

    if (email) {
      const existingUser = await userModel.findOne({
        email,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Please provide a unique email",
        });
      }
    }

    const updateObj = {};

    if (fullName) updateObj.fullName = fullName;
    if (email) updateObj.email = email;
    if (gender) updateObj.gender = gender;
    if (dateOfBirth) updateObj.dateOfBirth = dateOfBirth;
    if (req.file) updateObj.image = req.file.key;

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $set: updateObj },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// ========================= Disable User ===================== ||
exports.disableUser = async (req, res) => {
  try {
    const getUser = await userModel.findById(req.params.userId)
    if (!getUser) {
      return res.status(400).send({ success: false, message: "User Not Found" })
    }
    let updateUser = await userModel.findByIdAndUpdate(
      { _id: req.params.userId },
      {
        $set: {
          disable: !getUser.disable,
        },
      },
      { new: true }
    );
    if (updateUser.disable == true) {
      return res.status(200).json({
        success: true,
        message: "User Successfully Disable...",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "User Successfully Enable...",
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// ====================== Get User By PhoneNumber ==================== ||

exports.getUserByPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    let obj = {};
    obj.phoneNumber = phoneNumber;
    let User = await userModel.findOne(obj);
    if (!User) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }
    return res.status(200).send({
      success: true,
      message: "User Fatch Successfully",
      data: User,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/// Admin login

exports.adminLogin = async (req, res) => {
  try {
    const {
      phoneNumber,
      email,
      password,
      // FcmToken,
      // adminFcmToken,
      // superAdminFcmToken,
      // subAdminFcmToken,
    } = req.body;
    if (phoneNumber && email) {
      return res.status(400).json({
        success: false,
        message: "Only One Is Required (PhoneNumbe && Email)",
      });
    }
    if (!phoneNumber && !email) {
      return res.status(400).json({
        success: false,
        message: "Any One Is Required (PhoneNumbe && Email)",
      });
    }
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password Is Required...",
      });
    }
    let obj = {};
    if (phoneNumber) {
      obj.phoneNumber = phoneNumber;
    }
    if (email) {
      obj.email = email;
    }
    let user = await userModel.findOne(obj);

    console.log("User password from DB:", user.password);
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "Admin Not Found",
      });
    }
    let updateFields = {};
    // if (user.userType.includes(userTypes.userType.superAdmin)) {
    //   updateFields.superAdminFcmToken = FcmToken;
    // } else if (user.userType.includes(userTypes.userType.admin)) {
    //   updateFields.adminFcmToken = FcmToken;
    // } else if (user.userType.includes(userTypes.userType.subAdmin)) {
    //   updateFields.subAdminFcmToken = FcmToken;
    // }

    let result = await bcrypt.compareSync(password, user.password);
    if (!result) {
      return res.status(400).send({
        success: false,
        message: "Please Provide Valid Password..",
      });
    }

    const generate = await jwt.sign({ User: user._id }, "SECRETEKEY", {
      expiresIn: "56d",
    });
    let data = await userModel.findByIdAndUpdate(
      {
        _id: user._id,
      },
      {
        $set: updateFields,
      },
      { new: true }
    );
    data._doc.token = generate;
    return res.status(200).send({
      success: true,
      message: "Admin Successfully Login...",
      data: data,
    });
  } catch (error) {
    console.log(error.stack);
    return res.status(500).send({ success: false, message: error.message });
  }
};

exports.craeteAdminAndSubAdmin = async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      disable,
      userType,
      permissions,
      email,
      password,
    } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email Is Required",
      });
    }
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password Is Required...",
      });
    }
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone Number Is Required...",
      });
    }
    if (phoneNumber) {
      if (!validateMobileNumber(phoneNumber)) {
        return res.status(400).send({
          success: false,
          message: "please provide valid 10 digit number",
        });
      }
    }
    let obj = {};
    if (phoneNumber) {
      obj.phoneNumber = phoneNumber;
    }
    if (email) {
      obj.email = email;
    }
    const check = await userModel.findOne(obj);
    if (check) {
      return res
        .status(400)
        .json({ success: false, message: "User Is Already Exsist.." });
    }
    // console.log()
    if (userType && !Object.values(userTypes.userType).includes(userType)) {
      return res.status(400).json({
        success: false,
        message:
          "Only This Type Of UserType (ADMIN && SUB_ADMIN && CUSTOMER && PARTNER)",
      });
    }
    let hash = bcrypt.hashSync(req.body.password, 8);
    let userdata = await userModel.create({
      fullName: fullName,
      phoneNumber: phoneNumber,
      email: email,
      password: hash,
      userType: userType ? userType : "SUB_ADMIN",
      permissions: userType != "SUB_ADMIN" ? "ALL" : permissions,
      disable: disable,
    });
    return res.status(201).send({
      success: true,
      message: "Admin Create Successfully",
      data: userdata,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

exports.getUserBYToken = async (req, res) => {
  try {
    let token = req.headers["authorization"];
    let decodeToken = jwt.verify(token, "SECRETEKEY");
    if (!decodeToken) {
      return res
        .status(400)
        .send({ success: false, message: "token is not decoded" });
    }
    // console.log(decodeToken)
    let getUser = await userModel.findById({ _id: decodeToken.User });
    if (!getUser) {
      return res
        .status(400)
        .send({ success: false, message: "you are not a valid user" });
    }

    return res.status(200).send({
      success: true,
      message: "user fetched successfully",
      data: getUser,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};
