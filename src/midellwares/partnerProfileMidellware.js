const partnerProfileModel = require("../models/partnerProfileModel");

//  =================== profileVerificetionCompleted ====================== ||

exports.profileVerificetionCompleted = async (req, res, next) => {
  try {
    let check = false;;
    if (
      req.partnerProfile?.idDocument?.status === "APPROVED" &&
      req.partnerProfile?.selfie?.status === "APPROVED"
    ) {
      check = true;
    } else if (
      (req.partnerProfile?.selfie?.status === "APPROVED" &&
        req.body?.status === "APPROVED") ||
      (req.partnerProfile?.idDocument?.status === "APPROVED" &&
        req.body?.selfieStatus === "APPROVED")
    ) {
      check = true;
    } else if (
      req.body?.status === "APPROVED" &&
      req.body?.selfieStatus === "APPROVED"
    ) {
      check = true;
    }
      if (check) {
        await partnerProfileModel.findByIdAndUpdate(
          { _id: req.partnerProfile._id },
          {
            $set: {
              "idDocument.profileVerificetionCompleted": true,
            },
          },
          { new: true }
        );
      }
      else{
        await partnerProfileModel.findByIdAndUpdate(
          { _id: req.partnerProfile?._id },
          {
            $set: {
              "idDocument.profileVerificetionCompleted": false,
            },
          },
          { new: true }
        );
      }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
