const userModel = require("../models/userModel");
const partnerProfileModel = require("../models/partnerProfileModel");
const { userType } = require("../helper/userType");
const jwt = require("jsonwebtoken");
function validateMobileNumber(number) {
  const regex = /^[0-9]{10}$/;
  return regex.test(number);
}
// =========================== Admin Route Cheack ======================= ||

exports.adminRoute = async (req, res, next, id) => {
  try {
    let User = await userModel.findById(id);
    if (!User) {
      return res.status(404).json({
        success: false,
        message: "User Is Not Found In Date Base...",
      });
    } else {
      let authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "Token required" });
      }
      const token = authHeader.split(" ")[1];
      if (!token)
        return res.status(404).send({
          success: false,
          message: "jwt token must be required",
          isAuthorized: false,
        });
      let decodeToken = jwt.verify(token, "SECRETEKEY")
      if (!decodeToken)
        return res.status(400).send({
          success: true,
          message: "token is not valid",
          isAuthorized: false,
        });
      if (
        (User._id.toString() === decodeToken.User &&
          User.userType.includes(userType.admin)) ||
        User.userType.includes(userType.subAdmin) ||
        User.userType.includes(userType.superAdmin)
      ) {
        (req.Admin = User), next();
      } else {
        return res.status(400).json({
          success: false,
          message: "You Are Not Admin...",
        });
      }
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.adminMRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.User) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const user = await userModel.findById(decoded.User);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }
    // console.log(user)  
    const isAdmin =
      user.userType.includes("ADMIN"); //||
    // user.userType.includes("subAdmin") ||
    // user.userType.includes("superAdmin");
    // console.log(isAdmin)
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin access denied",
      });
    }

    req.admin = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token expired or unauthorized",
    });
  }
};
// =========================== User Route Check ======================= ||

exports.userRoute = async (req, res, next) => {
  try {
    let authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token required"
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "JWT token missing"
      });
    }

    const decodeToken = jwt.verify(token, "SECRETEKEY");

    if (!decodeToken || !decodeToken.User) {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    const User = await userModel.findById(decodeToken.User);

    if (!User) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ✅ attach user
    req.user = User;
    req.User = User; // compatibility with your existing code

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token expired or invalid"
    });
  }
};


exports.optional = async (req, res, next) => {
  try {
    let authHeader = req.headers.authorization;
    if (!authHeader) {
      req.user = null;
      req.User = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      req.user = null;
      req.User = null;
      return next();
    }

    const decodeToken = jwt.verify(token, "SECRETEKEY");

    if (!decodeToken || !decodeToken.User) {
      req.user = null;
      req.User = null;
      return next();
    }

    const User = await userModel.findById(decodeToken.User);

    if (!User) {
      req.user = null;
      req.User = null;
      return next();
    }

    req.user = User;
    req.User = User;

    next();

  } catch (error) {
    req.user = null;
    req.User = null;
    next();
  }
};

exports.partnerRoute = async (req, res, next) => {
  try {
    let authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token required"
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "JWT token missing"
      });
    }

    const decodeToken = jwt.verify(token, "SECRETEKEY");

    if (!decodeToken || !decodeToken.User) {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    const User = await userModel.findById(decodeToken.User);
    console.log(User)

    if (!User) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!User.userType.includes("PARTNER")) {
      return res.status(403).json({
        success: false,
        message: "Partner access denied"
      });
    }

    const partnerProfile = await partnerProfileModel.findOne({ userId: User._id });

    // ✅ attach user and partner profile
    req.user = User;
    req.User = User; 
    req.partner = partnerProfile;
    req.partnerProfile = partnerProfile;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token expired or invalid"
    });
  }
};
