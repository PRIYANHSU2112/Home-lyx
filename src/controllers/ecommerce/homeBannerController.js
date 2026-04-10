const homeBannerModel = require("../../models/ecommerce/homeBannerModel");
const mongoose = require("mongoose");
const {
  deleteFileFromObjectStorage,
} = require("../../midellwares/multerMidellware");
// ========================== Get Id =================================== ||

exports.getHomeBannerId = async (req, res, next, id) => {
  try {
    let HomeBanner = await homeBannerModel.findById(id);
    if (!HomeBanner) {
      return res.status(404).json({
        success: false,
        message: "Home Banner Not Found",
      });
    } else {
      (req.HomeBanner = HomeBanner), next();
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Create App Banner ================================== ||

exports.createHomeBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner Is Required...",
      });
    }


    let HomeBanner = await homeBannerModel.create({
      banner: req.file.key,
      title: req.body.title,
    });
    return res.status(201).json({
      success: true,
      message: "HomeBanner Is Created Successfully...",
      data: HomeBanner,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Get By Id =================================== ||

exports.getByHomeBannerId = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Home Banner Fatch Successfully...",
      data: req.HomeBanner,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================== Get All ============================ ||

exports.getAllHomeBanner = async (req, res) => {
  try {
    let HomeBanner = await homeBannerModel.find();
    if (!HomeBanner.length) {
      return res.status(400).json({
        success: false,
        message: "HomeBanner Not Found",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "All HomeBanner Fatch Successfully...",
        data: HomeBanner,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================== Update HomeBanner ============================ ||

exports.updateHomeBanner = async (req, res) => {
  try {
    let HomeBanner = req.HomeBanner;
    if (req.file && req.HomeBanner.banner) {
      deleteFileFromObjectStorage(req.HomeBanner.banner);
    }
    let updateHomeBanner = await homeBannerModel.findByIdAndUpdate(
      { _id: HomeBanner._id },
      {
        $set: {
          banner: req.file ? req.file.key : req.HomeBanner.banner,
          title: req.body.title,
        },
      },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "HomeBanner Update Successfully...",
      data: updateHomeBanner,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================== Delete HomeBanner ========================= ||

exports.deleteHomeBanner = async (req, res) => {
  try {
    let deleteHomeBanner = await homeBannerModel.deleteOne({
      _id: req.HomeBanner._id,
    });
    if (deleteHomeBanner.banner) {
      deleteFileFromObjectStorage(deleteHomeBanner.banner);
    }
    return res.status(200).json({
      success: true,
      message: "HomeBanner Delete Successfully...",
      data: deleteHomeBanner,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};




exports.disableBanner = async (req, res) => {
  try {
    const { HomeBannerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(HomeBannerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner id",
      });
    }
        const banner = await homeBannerModel.findById(HomeBannerId);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    banner.disable = !banner.disable;
     await banner.save();

   
    return res.status(200).json({
      success: true,
       message: banner.disable
        ? "Banner disabled successfully"
        : "Banner enabled successfully",
      data: banner,
    });

  } catch (error) {
    console.error("Disable Banner Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
