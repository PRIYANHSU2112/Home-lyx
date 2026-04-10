const { userPermissions } = require("../helper/userPermission");
const { userType: userTypeLookup } = require("../helper/userType");

/**
 * Robust helper to check permissions across multiple possible request properties.
 * Handles Admin, User, user, and admin objects set by various auth middlewares.
 */
const checkPermission = (req, res, next, requiredPermission) => {
  try {
    // Identify the user object from any of the standard request properties
    const user = req.Admin || req.User || req.user || req.admin;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Authentication required.",
      });
    }

    const roles = user.userType || [];
    const permissions = user.permissions || [];

    // Helper flags for better readability
    const isSuperAdmin = roles.includes(userTypeLookup.superAdmin);
    const isAdmin = roles.includes(userTypeLookup.admin);
    const isSubAdmin = roles.includes(userTypeLookup.subAdmin);
    const isPartner = roles.includes(userTypeLookup.partner);

    // 1. Super Admin: Full access to everything
    if (isSuperAdmin) {
      return next();
    }

    // 2. Partner: Allowed for specific modules (Product, Category, Brand)
    const partnerAllowedModules = [
      userPermissions.product,
      userPermissions.category,
      userPermissions.brand
    ];
    if (isPartner && partnerAllowedModules.includes(requiredPermission)) {
      return next();
    }

    // 3. Admin/Sub-Admin: Access based on specific assigned permissions
    if (isAdmin || isSubAdmin) {
      if (permissions.includes(requiredPermission) || permissions.includes(userPermissions.all)) {
        return next();
      }
    }

    // Default: Access Denied
    return res.status(403).json({
      success: false,
      message: `Access Denied: You do not have permission for ${requiredPermission}.`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Authorization Middleware Error: ${error.message}`,
    });
  }
};

// ================ Exported Middlewares =======================

exports.isCategory = (req, res, next) => checkPermission(req, res, next, userPermissions.category);
exports.isOrder = (req, res, next) => checkPermission(req, res, next, userPermissions.order);
exports.isProduct = (req, res, next) => checkPermission(req, res, next, userPermissions.product);
exports.isCity = (req, res, next) => checkPermission(req, res, next, userPermissions.city);
exports.isCoupon = (req, res, next) => checkPermission(req, res, next, userPermissions.coupon);
exports.isMembership = (req, res, next) => checkPermission(req, res, next, userPermissions.membership);
exports.isHomebanner = (req, res, next) => checkPermission(req, res, next, userPermissions.homebanner);
exports.isHomeCategory = (req, res, next) => checkPermission(req, res, next, userPermissions.homeCategory);
exports.isAppBanner = (req, res, next) => checkPermission(req, res, next, userPermissions.appBanner);
exports.isUser = (req, res, next) => checkPermission(req, res, next, userPermissions.users);
exports.isBrand = (req, res, next) => checkPermission(req, res, next, userPermissions.brand);
exports.isHomeProduct = (req, res, next) => checkPermission(req, res, next, userPermissions.homeProduct);
exports.isCompany = (req, res, next) => checkPermission(req, res, next, userPermissions.commpany);
exports.isTax = (req, res, next) => checkPermission(req, res, next, userPermissions.taxs);