const brandModel = require("../../models/ecommerce/brandModel");
const {
  deleteFileFromObjectStorage,
} = require("../../midellwares/multerMidellware");

const productModel = require("../../models/ecommerce/productModel");
// ========================== Get Id =================================== ||

exports.getbrandId = async (req, res, next, id) => {
  try {
    let brand = await brandModel.findById(id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "brand Not Found",
      });
    } else {
      (req.brand = brand), next();
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Create brand ================================== ||

exports.createBrand = async (req, res) => {
  try {
    const { name ,categoryId } = req.body;
    const image = req.file;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "name Is Required...",
      });
    }
    if (!image) {
      return res.status(400).json({
        success: false,
        message: "image Is Required...",
      });
    }
    let brand = await brandModel.create({
      name: name,
      categoryId,
      image: image.key,
    });
    return res.status(201).json({
      success: true,
      message: "brand Is Created Successfully...",
      data: brand,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Get By Id =================================== ||

exports.getByBrandId = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "brand Fatch Successfully...",
      data: req.brand,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================== Get All ============================ ||

const mongoose = require("mongoose");

exports.getAllBrand = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "categoryId is required",
      });
    }

    // Count total records
    const countPipeline = [
      {
        $match: {
          disable: false,
        },
      },
      {
        $lookup: {
          from: "ecommerceproductmodels",
          let: { brandId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$brandId", "$$brandId"] },
                    {
                      $eq: [
                        "$categoryId",
                        new mongoose.Types.ObjectId(categoryId),
                      ],
                    },
                    { $eq: ["$disable", false] },
                  ],
                },
              },
            },
          ],
          as: "products",
        },
      },
      {
        $addFields: {
          totalProducts: { $size: "$products" },
        },
      },
      {
        $match: {
          totalProducts: { $gt: 0 },
        },
      },
      { $count: "total" },
    ];

    const countResult = await brandModel.aggregate(countPipeline);
    const totalRecords = countResult[0]?.total || 0;

    // Get paginated data
    const dataPipeline = [
      {
        $match: {
          disable: false,
        },
      },
      {
        $lookup: {
          from: "ecommerceproductmodels",
          let: { brandId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$brandId", "$$brandId"] },
                    {
                      $eq: [
                        "$categoryId",
                        new mongoose.Types.ObjectId(categoryId),
                      ],
                    },
                    { $eq: ["$disable", false] },
                  ],
                },
              },
            },
          ],
          as: "products",
        },
      },
      {
        $addFields: {
          totalProducts: { $size: "$products" },
        },
      },
      {
        $match: {
          totalProducts: { $gt: 0 },
        },
      },
      {
        $project: {
          products: 0,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ];

    const brands = await brandModel.aggregate(dataPipeline);

    return res.status(200).json({
      success: true,
      message: "Category wise brands fetched successfully",
      data: brands,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// ======================== Update brand ============================ ||

exports.updateBrand = async (req, res) => {
  try {
    const brand = req.brand; // coming from middleware

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    // Prepare update object
    const updateData = {};

    if (req.body.name) {
      updateData.name = req.body.name.trim();
    }

    if (req.file) {
      updateData.image = req.file.key;
    }

    // If nothing to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    // Update brand first
    const updatedBrand = await brandModel.findByIdAndUpdate(
      brand._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Delete old image ONLY after successful update
    if (req.file && brand.image) {
      await deleteFileFromObjectStorage(brand.image);
    }

    return res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      data: updatedBrand,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================== Delete brand ========================= ||

exports.deleteBrand = async (req, res) => {
  try {
    console.log(req.brand._id);
    let deletebrand = await brandModel.deleteOne({
      _id: req.brand._id,
    });
    return res.status(200).json({
      success: true,
      message: "brand Delete Successfully...",
      data: deletebrand,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================ Disable brand ======================== ||

exports.disablebrand = async (req, res) => {
  try {
    let updatebrand = await brandModel.findByIdAndUpdate(
      { _id: req.brand._id },
      {
        $set: {
          disable: !req.brand.disable,
        },
      },
      { new: true }
    );
    if (updatebrand.disable == true) {
      return res.status(200).json({
        success: true,
        message: "brand Successfully Disable...",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "brand Successfully Enable...",
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================== Get All Brands (Simple) ============================ ||

exports.getAllBrands = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { disable } = req.query;

    let filter = {};
    if (disable !== undefined) {
      filter.disable = disable === 'true';
    }

    const totalRecords = await brandModel.countDocuments(filter);
    const totalPages = Math.ceil(totalRecords / limit);

    const brands = await brandModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: "All brands fetched successfully",
      data: brands,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================== Get All ============================ ||

exports.getAllBrandByAdmin = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { disable } = req.query;

    let obj = {};
    if (categoryId) {
      obj.categoryId = categoryId;
    }
    if (disable !== undefined) {
      obj.disable = disable === 'true';
    }

    const totalRecords = await brandModel.countDocuments(obj);
    const totalPages = Math.ceil(totalRecords / limit);

    const brands = await brandModel
      .find(obj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: "Brands fetched successfully",
      data: brands,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};



