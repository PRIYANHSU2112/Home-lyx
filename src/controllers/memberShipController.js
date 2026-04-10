const membershipModel = require("../models/memberShipModel");
const {
  deleteFileFromObjectStorage,
} = require("../midellwares/multerMidellware");
// ========================== Get Id =================================== ||

exports.getMembershipId = async (req, res, next, id) => {
  try {
    let Membership = await membershipModel.findById(id);
    if (!Membership) {
      return res.status(404).json({
        success: false,
        message: "Membership Not Found",
      });
    } else {
      (req.Membership = Membership), next();
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===================== Create Membership =================== ||

exports.createMembership = async (req, res) => {
  try {
    let {
      title,
      subtitle,
      features,
      price,
      durationInMonth,
      disable,
      discountPercent,
    } = req.body;
    let logo = req.file ? req.file.key : null;
    if (!title) {
      return res
        .status(400)
        .send({ success: false, message: "title is required" });
    }
    if (!logo) {
      return res
        .status(400)
        .send({ success: false, message: "logo is required" });
    }
    if (!features) {
      return res
        .status(400)
        .send({ success: false, message: "features is required" });
    }
    if (!price) {
      return res
        .status(400)
        .send({ success: false, message: "price is required" });
    }
    if (!durationInMonth) {
      return res
        .status(400)
        .send({ success: false, message: "durationInMonth is required" });
    }
    if (!discountPercent) {
      return res
        .status(400)
        .send({ success: false, message: "discountPercent is required" });
    }
    const data = await membershipModel.create({
      title: title,
      subtitle: subtitle,
      features: features,
      price: price,
      durationInMonth: durationInMonth,
      disable: disable,
      discountPercent: discountPercent,
      logo: logo,
    });
    return res.status(201).send({
      success: true,
      message: "MemberShip Is Created Successfully...",
      data: data,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ===================== Get Membership By Id ===================== ||

exports.getByMembershipId = async (req, res) => {
  try {
    res.status(200).send({
      success: true,
      message: "MemberShip Fatch Successfully...",
      result: req.Membership,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ========================== Update Membership ========================= ||

exports.updateMembership = async (req, res) => {
  try {
    let {
      title,
      subtitle,
      features,
      price,
      durationInMonth,
      disable,
      discountPercent,
    } = req.body;
    let logo = req.file ? req.file.key : null;
    if (logo && req.Membership.logo) {
      deleteFileFromObjectStorage(req.Membership.logo);
    }
    const data = await membershipModel.findOneAndUpdate(
      { _id: req.Membership._id },
      {
        $set: {
          title: title,
          subtitle: subtitle,
          features: features,
          price: price,
          durationInMonth: durationInMonth,
          disable: disable,
          discountPercent: discountPercent,
          logo: logo ? logo : req.Membership.logo,
        },
      },
      { new: true }
    );
    return res.status(200).send({
      success: true,
      message: "Membership Update Successfully...",
      data: data,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ====================== Delete Membership ============================= ||

exports.deleteMembership = async (req, res) => {
  try {
    if (req.Membership.logo) {
      deleteFileFromObjectStorage(req.Membership.logo);
    }
    const data = await membershipModel.deleteOne({ _id: req.Membership._id });
    return res.status(200).send({
      success: true,
      message: "Membership Deleted Successfully",
      data: data,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ======================= disable Membership ========================= ||

exports.disableMembership = async (req, res) => {
  try {
    let updateMembership = await membershipModel.findByIdAndUpdate(
      { _id: req.Membership._id },
      {
        $set: {
          disable: !req.Membership.disable,
        },
      },
      { new: true }
    );
    if (updateMembership.disable == true) {
      return res.status(200).json({
        success: true,
        message: "Membership Successfully Disable...",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Membership Successfully Enable...",
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================ Get All Membership ============================ ||

exports.getAllMembership = async (req, res) => {
  try {
    let page = req.query.page;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    let length = await membershipModel.countDocuments({ disable: false });
    let count = Math.ceil(length / 20);
    let updateMembership = await membershipModel
      .find({ disable: false })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex);
    // if (!updateMembership.length) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Membership Not Found",
    //   });
    // }
    return res.status(200).json({
      success: true,
      message: "Membership IS Fatch Successfully...",
      data: updateMembership,
      page: count,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================ Get All Membership ============================ ||

exports.getAllMembershipByAdmin = async (req, res) => {
  try {
    let page = req.query.page;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    let length = await membershipModel.countDocuments();
    let count = Math.ceil(length / 20);
    let updateMembership = await membershipModel
      .find()
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex);
    // if (!updateMembership.length) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Membership Not Found",
    //   });
    // }
    return res.status(200).json({
      success: true,
      message: "Membership IS Fatch Successfully...",
      data: updateMembership,
      page: count,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
