const questionModel = require("../models/questionModel");

exports.createQuestion = async (req, res) => {
  try {
    const { question, answer, userType } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "question is required",
      });
    }
    const createData = await questionModel.create({
      question: question,
      answer: answer,
      userType: userType,
    });
    return res.status(201).json({
      success: false,
      message: "question is create successfully",
      data: createData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { question, answer, userType } = req.body;
    const updateData = await questionModel.findByIdAndUpdate(
      { _id: req.params.questionId },
      {
        $set: {
          question: question,
          answer: answer,
          userType: userType,
        },
      },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "question is update successfully",
      data: updateData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllQuestion = async (req, res) => {
  try {
    const { disable, userType } = req.query;
    let obj = {};
    if (disable) {
      obj.disable = disable;
    }
    if (userType) {
      obj.userType = userType;
    }
    const findData = await questionModel.find(obj).sort({createdAt : -1});
    if (!findData.length) {
      return res.status(404).json({
        success: false,
        message: "data Not Found",
        data: findData,
      });
    }
    return res.status(200).json({
      success: true,
      message: "get All Quessation",
      data: findData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getByIdQuestion = async (req, res) => {
  try {
    const findData = await questionModel.findById(req.params.questionId);
    if (!findData) {
      return res.status(404).json({
        success: false,
        message: "data Not Found",
        // data: findData,
      });
    }
    return res.status(200).json({
      success: true,
      message: "get Quessation",
      data: findData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.disableQuestion = async (req, res) => {
  try {
    const findData = await questionModel.findById(req.params.questionId);

    if (!findData) {
      return res
        .status(400)
        .send({ success: false, message: "question Not Found" });
    }
    let updateQuestion = await questionModel.findByIdAndUpdate(
      { _id: req.params.questionId },
      {
        $set: {
          disable: !findData.disable,
        },
      },
      { new: true }
    );
    if (updateQuestion?.disable == true) {
      return res.status(200).json({
        success: true,
        message: "question Successfully Disable...",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "question Successfully Enable...",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
