const appBannerModel = require("../models/appBannerModel");
const {
  deleteFileFromObjectStorage,
} = require("../midellwares/multerMidellware");
// ========================== Get Id =================================== ||

exports.getAppBannerId = async (req, res, next, id) => {
  try {
    let appBanner = await appBannerModel.findById(id);
    if (!appBanner) {
      return res.status(404).json({
        success: false,
        message: "App Banner Not Found",
      });
    } else {
      (req.AppBanner = appBanner), next();
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Create App Banner ================================== ||

exports.createAppBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner Is Required...",
      });
    }
    let appBanner = await appBannerModel.create({
      banner: req.file.key,
    });
    return res.status(201).json({
      success: true,
      message: "AppBanner Is Created Successfully...",
      data: appBanner,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Get By Id =================================== ||

exports.getByAppBannerId = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "App Banner Fatch Successfully...",
      data: req.AppBanner,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================== Get All ============================ ||

exports.getAllAppBanner = async (req, res) => {
  try {
    let appBanner = await appBannerModel.find().sort({createdAt : -1});
    if (!appBanner.length) {
      return res.status(400).json({
        success: false,
        message: "AppBanner Not Found",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "All AppBanner Fatch Successfully...",
        data: appBanner,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================== Update appBanner ============================ ||

exports.updateappBanner = async (req, res) => {
  try {
    let appBanner = req.AppBanner;
    if (req.file && req.AppBanner.banner) {
      deleteFileFromObjectStorage(req.AppBanner.banner);
    }
    let updateappBanner = await appBannerModel.findByIdAndUpdate(
      { _id: appBanner._id },
      {
        $set: {
          banner: req.file ? req.file.key : req.AppBanner.banner,
        },
      },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "AppBanner Update Successfully...",
      data: updateappBanner,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================== Delete appBanner ========================= ||

exports.deleteappBanner = async (req, res) => {
  try {
    let deleteappBanner = await appBannerModel.deleteOne({
      _id: req.AppBanner._id,
    });
    if (deleteappBanner.banner) {
      deleteFileFromObjectStorage(deleteappBanner.banner);
    }
    return res.status(200).json({
      success: true,
      message: "AppBanner Delete Successfully...",
      data: deleteappBanner,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
