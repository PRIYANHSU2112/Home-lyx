const aboutUsModel = require("../models/aboutUsModel");

// ========================== Get Id =================================== ||

exports.getAboutUsId = async (req, res, next, id) => {
  try {
    let AboutUs = await aboutUsModel.findById(id);
    if (!AboutUs) {
      return res.status(404).json({
        success: false,
        message: "AboutUs Not Found",
      });
    } else {
      (req.AboutUs = AboutUs), next();
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Create AboutUs ================================== ||

exports.createAboutUs = async (req, res) => {
  try {
    let { name, title, discription } = req.body;
    if (!name || !title || !discription) {
      throw {
        status: 400,
        message: !name
          ? "name is Required..."
          : !title
          ? "title is Required..."
          : "discription is Required...",
      };
    }
    let AboutUs = await aboutUsModel.create({
      name: name,
      title: title,
      discription: discription,
    });
    return res.status(201).json({
      success: true,
      message: "AboutUs Is Created Successfully...",
      data: AboutUs,
    });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};

// ========================== Get AboutUs =================================== ||

exports.getAboutUs = async (req, res) => {
  try {
    let AboutUs = await aboutUsModel.findOne();
    if (!AboutUs) {
      return res.status(404).json({
        success: false,
        message: "AboutUs Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "AboutUs Fatch Successfully...",
      data: AboutUs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================== Update AboutUs ============================ ||

exports.updateAboutUs = async (req, res) => {
  try {
    let AboutUs = req.AboutUs;
    let { name, title, discription } = req.body;
    let updateAboutUs = await aboutUsModel.findByIdAndUpdate(
      { _id: AboutUs._id },
      {
        $set: {
          name: name,
          title: title,
          discription: discription,
        },
      },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "AboutUs Update Successfully...",
      data: updateAboutUs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================== Delete AboutUs ========================= ||

exports.deleteAboutUs = async (req, res) => {
  try {
    let deleteAboutUs = await aboutUsModel.deleteOne({
      _id: req.AboutUs._id,
    });
    return res.status(200).json({
      success: true,
      message: "AboutUs Delete Successfully...",
      data: deleteAboutUs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
