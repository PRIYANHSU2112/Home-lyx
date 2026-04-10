const partnerProfileHomeModel = require("../models/partnerProfileHomeModel");
const {
  deleteFileFromObjectStorage,
} = require("../midellwares/multerMidellware");

////////////////////////////////  Update model  ////////////////////////////////

exports.updateModel = async (req, res) => {
  try {
    let { link } = req.body;
    let banner = req.file ? req.file.key : null;
    let check = await partnerProfileHomeModel.findById({
      _id: req.params.partnerProfileHomeId,
    });
    if (banner && check.banner != null) {
      deleteFileFromObjectStorage(check.banner);
    }
    let data = await partnerProfileHomeModel.findByIdAndUpdate(
      { _id: req.params.partnerProfileHomeId },
      {
        $set: {
          link: link,
          banner: banner ? banner : check.banner,
        },
      },
      { new: true }
    );
    return res
      .status(200)
      .json({ success: true, message: "Update successful", data: data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

///////////////////////////////  Get by id  //////////////////////////////////

exports.getById = async (req, res) => {
  try {
    let check = await partnerProfileHomeModel.findOne();
    return res
      .status(200)
      .json({ success: true, message: "partnerProfileHome fatch Successfully..", data: check });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
