const privacyModel = require("../models/privacyModel");

// ========================== Get Id =================================== ||

exports.getPrivacyId = async (req, res, next, id) => {
  try {
    let Privacy = await privacyModel.findById(id);
    if (!Privacy) {
      return res.status(404).json({
        success: false,
        message: "PrivacyPolicy Not Found",
      });
    } else {
      (req.Privacy = Privacy), next();
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Create Privacy ================================== ||

exports.createPrivacy = async (req, res) => {
  try {
    let { name, discription } = req.body;
    if (!discription || !name) {
      throw {
        status: 400,
        message: !name ? "name is Required..." : "discription is Required...",
      };
    }
    let Privacy = await privacyModel.create({
      name: name,
      discription: discription,
    });
    return res.status(201).json({
      success: true,
      message: "PrivacyPolicy Is Created Successfully...",
      data: Privacy,
    });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};

// ========================== Get By Id =================================== ||

exports.getPrivacyPolicy = async (req, res) => {
  try {
    let Privacy = await privacyModel.findOne();
    if(!Privacy){
      return res.status(404).json({
        success: false,
        message: "PrivacyPolicy Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Privacy Fatch Successfully...",
      data: Privacy,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================== Update Privacy ============================ ||

exports.updatePrivacy = async (req, res) => {
  try {
    let Privacy = req.Privacy;
    let { name, discription } = req.body;
    let updatePrivacy = await privacyModel.findByIdAndUpdate(
      { _id: Privacy._id },
      {
        $set: {
          name: name,
          discription: discription,
        },
      },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "PrivacyPolicy Update Successfully...",
      data: updatePrivacy,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================== Delete Privacy ========================= ||

exports.deletePrivacy = async (req, res) => {
  try {
    let deletePrivacy = await privacyModel.deleteOne({
      _id: req.Privacy._id,
    });
    return res.status(200).json({
      success: true,
      message: "PrivacyPolicy Delete Successfully...",
      data: deletePrivacy,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
