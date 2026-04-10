const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

exports.userAuth = async (req, res, next) => {
  try {
    // 🔹 1. Get token
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required"
      });
    }

    // 🔹 2. Extract token (Bearer token)
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    // 🔹 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔹 4. Find user
    const user = await userModel.findById(decoded._id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    // 🔹 5. Attach user to request
    req.user = user;     // full user object
    req.User = user;     // (for compatibility with your existing code)

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};
