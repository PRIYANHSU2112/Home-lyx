const HelpAndSupport = require("../models/helpSupportModel");

//HelpAndSupport

exports.createHelpAndSupport = async (req, res) => {
  try {
    const { heading, description, diasble } = req.body;

    const data = await HelpAndSupport.create({
      heading,
      description,
      diasble,
    });
    res.status(201).json({
      success: true,
      message: "Help & Support created successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllHelpAndSupport = async (req, res) => {
  try {
    const data = await HelpAndSupport.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getHelpAndSupportById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await HelpAndSupport.findById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Help & Support not found",
      });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateHelpAndSupport = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedData = await HelpAndSupport.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedData) {
      return res.status(404).json({
        success: false,
        message: "Help & Support not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Help & Support updated successfully",
      data: updatedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.toggleHelpAndSupportDisable = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await HelpAndSupport.findById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Help & Support not found",
      });
    }

    data.diasble = !data.diasble;
    await data.save();

    res.status(200).json({
      success: true,
      message: `Help & Support ${
        data.diasble ? "disabled" : "enabled"
      } successfully`,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteHelpAndSupport = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedData = await HelpAndSupport.findByIdAndDelete(id);

    if (!deletedData) {
      return res.status(404).json({
        success: false,
        message: "Help & Support not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Help & Support deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
