const partnerProfileModel = require("../models/partnerProfileModel");
const userModel = require("../models/userModel");
const {
  deleteFileFromObjectStorage,
} = require("../midellwares/multerMidellware");
const { partnerIdCard } = require("../midellwares/partnerProfileId");
const {
  idDocumentStatus,
  idDocumentType,
} = require("../helper/idDocumentStatus");

// ========================== Get Id =================================== ||

exports.getPartnerProfileId = async (req, res, next, id) => {
  try {
    let partnerProfile = await partnerProfileModel
      .findById(id)
      .populate("cityId userId");
    if (!partnerProfile) {
      return res.status(404).json({
        success: false,
        message: "partnerProfile Not Found",
      });
    } else {
      (req.partnerProfile = partnerProfile), next();
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Create partnerProfile ================================== ||

exports.createPartnerProfile = async (req, res) => {
  try {
    const {
      address,
      pincode,
      longitude,
      latitude,
      addharNumber,
      userId,
      remark,
      name,
      vendorType,
      email,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }
    if (!addharNumber) {
      return res.status(400).json({ success: false, message: "addharNumber is required" });
    }
    if (!address) {
      return res.status(400).json({ success: false, message: "address is required" });
    }
    if (!pincode) {
      return res.status(400).json({ success: false, message: "pincode is required" });
    }

    const selfie = req.files?.selfie?.[0]?.key ?? null;
    const frontImage = req.files?.frontImage?.[0]?.key ?? null;
    const backImage = req.files?.backImage?.[0]?.key ?? null;
    const documents = req.files?.documents?.[0]?.key ?? null;

    if (!selfie) {
      return res.status(400).json({ success: false, message: "selfie is required" });
    }
    if (!frontImage) {
      return res.status(400).json({ success: false, message: "frontImage is required" });
    }
    if (!backImage) {
      return res.status(400).json({ success: false, message: "backImage is required" });
    }

    const [existingProfile, user] = await Promise.all([
      partnerProfileModel.findOne({ userId }),
      userModel.findById(userId),
    ]);

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Partner profile already exists",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const partnerProfile = await partnerProfileModel.create({
      name: user.fullName ? user.fullName : name,
      email: user.email ? user.email : email,
      phoneNumber: user.phoneNumber,
      address,
      pincode,
      userId,
      longitude,
      latitude,
      remark,
      vendorType,
      documents,
      selfie: { image: selfie },
      idDocument: { frontImage, backImage, addharNumber },
    });

    return res.status(201).json({
      success: true,
      message: "Partner profile created successfully",
      data: partnerProfile,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDocumentsPartnerProfile = async (req, res) => {
  try {
    let partnerProfile = req.partnerProfile;
    let documents;
    if (req.file) {
      documents = req.file ? req.file.key : null;
    }
    if (!documents) {
      return res.status(400).json({
        success: false,
        message: "documents Is Required...",
      });
    }
    if (documents != null && partnerProfile.documents != null) {
      deleteFileFromObjectStorage(partnerProfile.documents);
    }
    let updatepartnerProfile = await partnerProfileModel
      .findByIdAndUpdate(
        { _id: partnerProfile._id },
        {
          $set: {
            documents: documents,
          },
        },
        { new: true }
      )
      .populate("userId");
    return res.status(200).json({
      success: true,
      message: "partnerProfile documents Update Successfully...",
      data: updatepartnerProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Get By Id =================================== |


exports.getBypartnerProfileByUserId = async (req, res) => {
  try {
    let check = await partnerProfileModel.findOne({
      userId: req.params.userId,
    });
    return res.status(200).json({
      success: true,
      message: "partnerProfile Fatch Successfully...",
      data: check,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBypartnerProfileId = async (req, res) => {
  try {
    const partnerProfile = req.partnerProfile;

    if (!partnerProfile) {
      return res.status(404).json({
        success: false,
        message: "Partner profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Partner profile fetched successfully.",
      data: partnerProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================== Get All ============================ ||

const PAGE_SIZE = 20;

exports.getAllpartnerProfile = async (req, res) => {
  try {
    const { page = 1, search, disable, orderPartner } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const skip = (currentPage - 1) * PAGE_SIZE;

    const query = {
      phoneNumber: { $nin: [null, undefined] },
    };

    if (search) {
      const isPhoneSearch =
        search.length === 10 && !isNaN(Number(search));

      if (isPhoneSearch) {
        query.phoneNumber = Number(search);
      } else {
        query.name = { $regex: search, $options: "i" };
      }
    }

    if (disable !== undefined) {
      query.disable = disable === "true";
    }

    const [partnerProfiles, totalCount] = await Promise.all([
      partnerProfileModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .populate("cityId userId")
        .lean(),
      partnerProfileModel.countDocuments(query),
    ]);

    if (orderPartner === "true") {
      partnerProfiles.forEach((profile) => {
        if (profile.userId) {
          profile.fullName = profile.userId.fullName;
          profile.userId = profile.userId._id;
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "All partner profiles fetched successfully",
      data: partnerProfiles,
      totalCount,
      totalPages: Math.ceil(totalCount / PAGE_SIZE),
      page: currentPage,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// ======================== Update partnerProfile ============================ ||

exports.updatePartnerProfile = async (req, res) => {
  try {
    let partnerProfile = req.partnerProfile;
    let {
      fullName,
      email,
      address,
      pincode,
      longitude,
      latitude,
      addharNumber,
      vendorType,
      userId,
      remark,
    } = req.body;
    let selfie;
    let frontImage;
    let backImage;
    let documents;


    if (req.files) {
      const fileFieldMap = [
        {
          field: "selfie",
          getKey: (f) => f.selfie?.[0]?.key,
          getExisting: () => partnerProfile.selfie?.image,
          assign: (val) => (selfie = val),
        },
        {
          field: "documents",
          getKey: (f) => f.documents?.[0]?.key,
          getExisting: () => partnerProfile.documents,
          assign: (val) => (documents = val),
        },
        {
          field: "frontImage",
          getKey: (f) => f.frontImage?.[0]?.key,
          getExisting: () => partnerProfile.idDocument?.frontImage,
          assign: (val) => (frontImage = val),
        },
        {
          field: "backImage",
          getKey: (f) => f.backImage?.[0]?.key,
          getExisting: () => partnerProfile.idDocument?.backImage,
          assign: (val) => (backImage = val),
        },
      ];

      for (const { field, getKey, getExisting, assign } of fileFieldMap) {
        if (req.files[field]) {
          const newKey = getKey(req.files);
          const existingKey = getExisting();

          assign(newKey ?? null);

          if (newKey && existingKey) {
            deleteFileFromObjectStorage(existingKey);
          }
        }
      }
    }

    let check = await userModel.findById(userId);

    // Prepare Selfie Update
    let selfieObj = { ...partnerProfile.selfie };
  
    if (selfie) {
      selfieObj.image = selfie;
      selfieObj.status = "PENDING";
    }
    console.log(selfieObj)

    // Prepare idDocument Update
    let idDocObj = { ...partnerProfile.idDocument };
    let isIdUpdated = false;
    if (backImage) { idDocObj.backImage = backImage; isIdUpdated = true; }
    if (frontImage) { idDocObj.frontImage = frontImage; isIdUpdated = true; }
    if (addharNumber) { idDocObj.addharNumber = addharNumber; isIdUpdated = true; }

    if (isIdUpdated) {
      idDocObj.status = "PENDING";
      idDocObj.profileVerificetionCompleted = false;
    }

    console.log(idDocObj)

    let updatepartnerProfile = await partnerProfileModel
      .findOneAndUpdate(
        { _id: partnerProfile._id },
        {
          $set: {
            name: fullName
              ? fullName
              : check
                ? check.fullName
                : req.partnerProfile.name,
            email: email
              ? email
              : check
                ? check?.email
                : req.partnerProfile.email,
            phoneNumber: check
              ? check?.phoneNumber
              : req.partnerProfile.phoneNumber,
            address: address,
            pincode: pincode,
            userId: userId,
            vendorType: vendorType,
            longitude: longitude,
            documents: documents,
            latitude: latitude,
            selfie: selfieObj,
            idDocument: idDocObj,
            remark: remark,
          },
        },
        { new: true }
      )
      .populate("userId");
    return res.status(200).json({
      success: true,
      message: "partnerProfile Update Successfully...",
      data: updatepartnerProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================== Delete partnerProfile ========================= ||

exports.deletepartnerProfile = async (req, res) => {
  try {
    let deletepartnerProfile = await partnerProfileModel.deleteOne({
      _id: req.partnerProfile._id,
    });
    return res.status(200).json({
      success: true,
      message: "partnerProfile Delete Successfully...",
      data: deletepartnerProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================ Disable partnerProfile ======================== ||

exports.disablepartnerProfile = async (req, res) => {
  try {
    let updatepartnerProfile = await partnerProfileModel.findByIdAndUpdate(
      { _id: req.partnerProfile._id },
      {
        $set: {
          disable: !req.partnerProfile.disable,
        },
      },
      { new: true }
    );
    if (updatepartnerProfile.disable == true) {
      return res.status(200).json({
        success: true,
        message: "partnerProfile Successfully Disable...",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "partnerProfile Successfully Enable...",
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== updateSelfiePartnerProfile ========================= ||

exports.updateSelfiePartnerProfile = async (req, res) => {
  try {
    const partnerProfile = req.partnerProfile;
    const selfie = req.file?.key ?? null;

    if (!selfie) {
      return res.status(400).json({
        success: false,
        message: "Selfie is required",
      });
    }

    const updatedProfile = await partnerProfileModel
      .findByIdAndUpdate(
        partnerProfile._id,
        { $set: { selfie: { image: selfie, status: "PENDING" } } },
        { new: true }
      )
      .populate("userId");

    if (partnerProfile.selfie?.image) {
      deleteFileFromObjectStorage(partnerProfile.selfie.image);
    }

    return res.status(200).json({
      success: true,
      message: "Partner profile selfie updated successfully",
      data: updatedProfile,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== updateDocumentPartnerProfile ========================= ||

exports.updateDocumentPartnerProfile = async (req, res) => {
  try {
    let partnerProfile = req.partnerProfile;
    let frontImage;
    let backImage;
    if (req.files && req.files.frontImage) {
      frontImage = req.files.frontImage ? req.files.frontImage[0].key : null;
    }
    if (req.files && req.files.backImage) {
      backImage = req.files.backImage ? req.files.backImage[0].key : null;
    }
    if (frontImage && partnerProfile.idDocument.frontImage != null) {
      deleteFileFromObjectStorage(partnerProfile.idDocument.frontImage);
    }
    if (backImage && partnerProfile.idDocument.backImage != null) {
      deleteFileFromObjectStorage(partnerProfile.idDocument.backImage);
    }
    if (!backImage || !frontImage || !req.body.addharNumber) {
      throw {
        status: 400,
        message: !backImage
          ? "backImage IS Required.."
          : !frontImage
            ? "frontImage Is Required..."
            : "addharNumber Is Required...",
      };
    }
    let obj = {};
    obj.backImage = backImage;
    obj.frontImage = frontImage;
    obj.addharNumber = req.body.addharNumber;
    obj.status = "PENDING";
    let updatepartnerProfile = await partnerProfileModel
      .findByIdAndUpdate(
        { _id: partnerProfile._id },
        {
          $set: {
            idDocument: obj,
          },
        },
        { new: true }
      )
      .populate("userId");
    return res.status(200).json({
      success: true,
      message: "partnerProfile Document Update Successfully...",
      data: updatepartnerProfile,
    });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};

// ====================== updateDocumentPartnerProfile ========================= ||

exports.updateDocumentStatus = async (req, res) => {
  try {
    const { status, selfieStatus } = req.body;
    const partnerProfile = req.partnerProfile;
    const validStatuses = Object.values(idDocumentStatus);

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid status (REJECTED, PENDING, APPROVED)",
      });
    }

    if (selfieStatus && !validStatuses.includes(selfieStatus)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid selfie status (REJECTED, PENDING, APPROVED)",
      });
    }

    const updateFields = {};
    if (status) updateFields["idDocument.status"] = status;
    if (selfieStatus) updateFields["selfie.status"] = selfieStatus;

    const updatedProfile = await partnerProfileModel
      .findByIdAndUpdate(
        partnerProfile._id,
        { $set: updateFields },
        { new: true }
      )
      .populate("cityId userId");

    return res.status(200).json({
      success: true,
      message: "Partner profile document status updated successfully",
      data: updatedProfile,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.IdCardGenrate = async (req, res) => {
  try {
    let code = await partnerIdCard(req.params.userId);
    console.log(req.params.userId);
    const updatepartnerProfile = await partnerProfileModel
      .findOneAndUpdate(
        { userId: req.params.userId },
        {
          $set: {
            idCard: `home-lyx/${code}.pdf`,
          },
        },
        { new: true }
      )
      .populate("cityId userId");
    return res.status(200).json({
      success: true,
      message: "id Card Genrate",
      data: updatepartnerProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};




const fs = require('fs');
const AWS = require('aws-sdk');
// require('dotenv').config();

// Configure the AWS SDK with Linode Object Storage credentials

const s3 = new AWS.S3({
  accessKeyId: process.env.LINODE_OBJECT_STORAGE_ACCESS_KEY_ID,
  secretAccessKey: process.env.LINODE_OBJECT_STORAGE_SECRET_ACCESS_KEY,
  endpoint: process.env.LINODE_OBJECT_STORAGE_ENDPOINT, // or the appropriate endpoint for your region
  s3ForcePathStyle: true, // Required for Linode Object Storage
  signatureVersion: 'v4'
});

exports.imageDownload = (req, res) => {

  console.log("ghit")
  const { imagePath } = req.query

  const bucketName = process.env.LINODE_OBJECT_BUCKET;
  const objectKey = imagePath // Change to the path of your image in the bucket
  const downloadPath = './image.jpg';

  // const bucketName = bucketName;
  // const objectKey = objectKey; // Change to the path of your image in the bucket

  const params = {
    Bucket: bucketName,
    Key: objectKey,
  };

  s3.getObject(params, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error fetching the image');
      return;
    }

    res.setHeader('Content-Disposition', 'attachment; filename=image.jpg'); // Suggests a filename for the download
    res.setHeader('Content-Type', 'image/jpeg'); // Set the appropriate content type
    console.log(data.Body)
    res.send(data.Body);

  });
}

// ====================== Average Rating API ========================= ||

exports.getPartnerAverageRating = async (req, res) => {
  try {
    const { partnerId, type } = req.query;

    if (!partnerId) {
      return res.status(400).json({ success: false, message: "partnerId is required" });
    }

    if (!["ecommerce", "service"].includes(type)) {
      return res.status(400).json({ success: false, message: "type must be 'ecommerce' or 'service'" });
    }

    let stats;
    if (type === "ecommerce") {
      const Product = require("../models/ecommerce/productModel");
      const EcomReview = require("../models/ecommerce/reviewModel");

      const products = await Product.find({ partnerId }, { _id: 1 });
      const productIds = products.map(p => p._id);

      stats = await EcomReview.aggregate([
        { $match: { productId: { $in: productIds }, disable: false } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            count: { $sum: 1 }
          }
        }
      ]);
    } else {
      const Booking = require("../models/bookingModel");
      const ServiceReview = require("../models/reviewModel");

      const bookings = await Booking.find({ partnerId }, { _id: 1 });
      const bookingIds = bookings.map(b => b._id);

      stats = await ServiceReview.aggregate([
        { $match: { bookingId: { $in: bookingIds }, disable: false } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            count: { $sum: 1 }
          }
        }
      ]);
    }

    const { averageRating = 0, count = 0 } = stats.length > 0 ? stats[0] : {};

    return res.status(200).json({
      success: true,
      message: "Average rating fetched successfully",
      data: {
        averageRating: Number(averageRating.toFixed(1)),
        count
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
