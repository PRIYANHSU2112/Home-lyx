const homeProductModel = require("../models/homeProductModel");
// ========================== Get Id =================================== ||

exports.getHomeProductId = async (req, res, next, id) => {
  try {
    let homeProduct = await homeProductModel.findById(id);
    if (!homeProduct) {
      return res.status(404).json({
        success: false,
        message: "home Product Not Found",
      });
    } else {
      (req.homeProduct = homeProduct), next();
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Create App Banner ================================== ||

exports.createHomeProduct = async (req, res) => {
  try {
    let { title, description, products } = req.body;
    let homeProduct = await homeProductModel.create({
      title: title,
      description: description,
      products: products,
    });
    return res.status(201).json({
      success: true,
      message: "home Product Is Created Successfully...",
      data: homeProduct,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Get By Id =================================== ||

exports.getByHomeProductId = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "home Product Fatch Successfully...",
      data: req.homeProduct,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================== Get All ============================ ||

exports.getAllHomeProduct = async (req, res) => {
  try {
    let homeProduct = await homeProductModel
      .find()
      .sort({createdAt : -1})
      .populate([{ path: "products" }]);
    if (!homeProduct.length) {
      return res.status(400).json({
        success: false,
        message: "home Product Not Found",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "All homeProduct Fatch Successfully...",
        data: homeProduct,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================== Update Home Product ============================ ||

exports.updateHomeProduct = async (req, res) => {
  try {
    let { title, description, products } = req.body;
    let homeProduct = await homeProductModel.findByIdAndUpdate(
      { _id: req.homeProduct._id },
      {
        $set: {
          title: title,
          description: description,
          products: products ? products : req.homeProduct.product,
        },
      },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "homeProduct Update Successfully...",
      data: homeProduct,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================== Delete CategoryProduct ========================= ||

exports.deleteHomeProduct = async (req, res) => {
  try {
    let homeProduct = await homeProductModel.deleteOne({
      _id: req.homeProduct._id,
    });
    return res.status(200).json({
      success: true,
      message: "homeProduct Delete Successfully...",
      data: homeProduct,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
