const FAQModel = require("../models/FAQModel");

// Get FAQ by ID middleware
exports.getFAQId = async (req, res, next, id) => {
  try {
    const FAQ = await FAQModel.findById(id);
    if (!FAQ) {
      return res.status(404).json({
        success: false,
        message: "FAQ Not Found",
      });
    }
    req.FAQ = FAQ;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create FAQ
exports.createFAQ = async (req, res) => {
  try {
    const { question, answer, helpSupportId } = req.body;

    if (!question || !answer || !helpSupportId) {
      return res.status(400).json({
        success: false,
        message: "question, answer and helpSupportId are required",
      });
    }

    const FAQ = await FAQModel.create({
      question,
      answer,
      helpSupportId,
    });

    res.status(201).json({
      success: true,
      message: "FAQ created successfully",
      data: FAQ,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get FAQ by ID
exports.getByFAQId = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.FAQ,
  });
};

// Get All FAQ
exports.getAllFAQ = async (req, res) => {
  try {
    const FAQ = await FAQModel.find({disabled: false})
      .populate("helpSupportId", "heading")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: FAQ.length,
      data: FAQ,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllFAQAdmin = async (req, res) => {
  try {
    const FAQ = await FAQModel.find()
      .populate("helpSupportId", "heading")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: FAQ.length,
      data: FAQ,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Get FAQ by Help & Support Category
exports.getFAQByHelpSupport = async (req, res) => {
  try {
    const { helpSupportId } = req.params;

    const FAQ = await FAQModel.find({ helpSupportId, disabled: false }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: FAQ.length,
      data: FAQ,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update FAQ
exports.updateFAQ = async (req, res) => {
  try {
    const { question, answer } = req.body;

    const updatedFAQ = await FAQModel.findByIdAndUpdate(
      req.FAQ._id,
      { question, answer },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "FAQ updated successfully",
      data: updatedFAQ,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete FAQ
exports.deleteFAQ = async (req, res) => {
  try {
    await FAQModel.findByIdAndDelete(req.FAQ._id);

    res.status(200).json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
