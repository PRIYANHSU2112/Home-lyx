const contactUsModel = require("../models/contactUsModel");

function validateMobileNumber(number) {
  const regex = /^[0-9]{10}$/;
  return regex.test(number);
}


// ========================== Get Id =================================== ||

exports.getContactUsId = async (req, res, next, id) => {
  try {
    let ContactUs = await contactUsModel.findById(id);
    if (!ContactUs) {
      return res.status(404).json({
        success: false,
        message: "ContactUs Not Found",
      });
    } else {
      (req.ContactUs = ContactUs), next();
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Create ContactUs ================================== ||

exports.createContactUs = async (req, res) => {
  try {
    let { fullName, email, discription, mobile } = req.body;
    if (!fullName || !email || !discription || !mobile)  {
      throw {
        status: 400,
        message: !fullName
          ? "fullName is Required..."
          : !email
          ? "email is Required..."
		  :!mobile
		  ?"mobile is Required..."
          : "discription is Required...",
      };
    }

      if (!validateMobileNumber(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    let ContactUs = await contactUsModel.create({
      fullName: fullName,
      email: email,
      discription: discription,
		mobile:mobile
    });
    return res.status(201).json({
      success: true,
      message: "ContactUs Is Created Successfully...",
      data: ContactUs,
    });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};

// ========================== Get By Id =================================== ||

exports.getByContactUsId = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "ContactUs Fatch Successfully...",
      data: req.ContactUs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================== Get All ============================ ||

exports.getAllContactUs = async (req, res) => {
  try {
    let page = req.query.page;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    let length = await contactUsModel.countDocuments();
    let count = Math.ceil(length / 20);
    let ContactUs = await contactUsModel
      .find()
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex);
    // if (!ContactUs.length) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "ContactUs Not Found",
    //   });
    // } else {
      return res.status(200).json({
        success: true,
        message: "All ContactUs Fatch Successfully...",
        data: ContactUs,
        page: count,
      });
    // }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================== Update ContactUs ============================ ||

exports.updateContactUs = async (req, res) => {
  try {
    let ContactUs = req.ContactUs;
    let { fullName, email, discription,mobile } = req.body;
    let updateContactUs = await contactUsModel.findByIdAndUpdate(
      { _id: ContactUs._id },
      {
        $set: {
          fullName: fullName,
          email: email,
          discription: discription,
			mobile:mobile
        },
      },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "ContactUs Update Successfully...",
      data: updateContactUs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================== Delete ContactUs ========================= ||

exports.deleteContactUs = async (req, res) => {
  try {
    let deleteContactUs = await contactUsModel.deleteOne({
      _id: req.ContactUs._id,
    });
    return res.status(200).json({
      success: true,
      message: "ContactUs Delete Successfully...",
      data: deleteContactUs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
