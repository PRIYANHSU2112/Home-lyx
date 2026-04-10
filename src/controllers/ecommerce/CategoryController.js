const fs = require("fs");
const productModel = require("../../models/ecommerce/productModel");
const categoryModel = require("../../models/ecommerce/categoryModel");
const {
  deleteFileFromObjectStorage,
} = require("../../midellwares/multerMidellware");
const {
  generateTransactionId,
  generateCategorySlug,
} = require("../../helper/slugGenreted");
// ========================== Get Id =================================== ||

exports.getCategoryId = async (req, res, next, id) => {
  try {
    let Category = await categoryModel.findById(id).populate("pCategory");
    if (!Category) {
      return res.status(404).json({
        success: false,
        message: "Category Not Found",
      });
    } else {
      (req.Category = Category), next();
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategoryBySlug = async (req, res) => {
  const { slug } = req.query;

  if (!slug) {
    return res
      .status(404)
      .json({ success: false, message: "Category are required" });
  }

  const category = await categoryModel.findOne({ slug }).populate("pCategory");

  if (!category) {
    return res
      .status(404)
      .json({ success: false, message: "category are not found" });
  }

  res.status(200).json({
    success: false,
    message: "Fetched category successfully",
    data: category,
  });
};

// exports.getCategoryId = async(req,res)=>{

// try {
//     const {categoryId,slug} = req.query;

//     if(!categoryId && !slug){
//       return res.status(404).json({success:false,message:"CategoryId or slug is require"})
//     };

//     let category;

//     if(categoryId){
//        category = await categoryModel.findById(categoryId);
//     } else if(slug){
//        category = await categoryModel.findOne({slug:slug})
//     }

//     if(!category){
//       return res.status(404).json({
//         success:false,message:"Category not found"
//       })
//     }

//     res.status(200).json({success:true,message:"Fetched category successfully",data:category})

// } catch (error) {
//   res.status(500).json({success:false,message:error.message})
// }

// }

exports.createCategory = async (req, res) => {
  try {
    const { name, adminCommission } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name Is Required",
      });
    }

    //  console.log(req.files);
    //  console.log(req.files.icon[0]);
    if (!req.files || !req.files.icon) {
      return res.status(400).json({
        success: false,
        message: "Icon Is Required",
      });
    }

    const icon = req.files.icon[0].location;

    // ✅ Slug generation
    const slug = generateCategorySlug(
      "category",
      name,
      "sub-category",
      name.toLowerCase(),
    );

    const category = await categoryModel.create({
      name,
      icon,
      slug,
      adminCommission: adminCommission || 1,
    });

    return res.status(201).json({
      success: true,
      message: "Category Created Successfully",
      data: category,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params;
    console.log(categoryId);
    const category = await categoryModel
      .findById(categoryId)
      .populate("pCategory"); // parent category
    // .populate("cityId") // city details
    // .populate("reviews.userId"); // user details inside reviews

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category  Not Found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + "sdsdsd",
    });
  }
};

exports.getAllCategory = async (req, res) => {
  try {
    const { search, disable } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // console.log(search, disable)

    // 🔍 filter object
    const filter = {};
    if (disable !== undefined) {
      filter.disable = disable === "true";
    }
    // 🔍 search by name
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    console.log(filter);

    const total = await categoryModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const Category = await categoryModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    // .populate("pCategory");

    console.log(Category);

    return res.status(200).json({
      success: true,
      message: "All Category Fetch Successfully",
      data: Category,
      page,
      totalPages,
      totalRecords: total,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    let { name, pCategory, adminCommission } = req.body;
    let icons;
    if (req.files) {
      req.files.banner
        ? req.files.banner.map((file) => {
            if (file.mimetype == "video/mp4") {
              let obj = {
                type: "VIDEO",
                url: file.key,
              };
              req.Category.banner.push(obj);
            }
            if (
              file.mimetype == "image/jpeg" ||
              file.mimetype == "image/avif" ||
              file.mimetype == "image/jpeg" ||
              file.mimetype == "image/png"
            ) {
              let obj = {
                type: "IMAGE",
                url: file.key,
              };
              req.Category.banner.push(obj);
            }
          })
        : null;
      icons = req.files.icon ? req.files.icon[0].key : null;
    }
    if (icons && req.Category.icon) {
      deleteFileFromObjectStorage(req.Category.icon);
    }
    let slug;
    if (!pCategory && !req.Category?.pCategory) {
      slug = await generateTransactionId(
        "category",
        name?.toString()?.toLocaleLowerCase(),
      );
    } else {
      slug = await generateCategorySlug(
        `category`,
        req.Category?.pCategor?.name,
        "sub-categpry",
        name ? name : req.Category?.name,
      );
    }
    let updateCategory = await categoryModel.findByIdAndUpdate(
      { _id: req.Category._id },
      {
        $set: {
          name: name,
          pCategory: pCategory,
          banner: req.Category.banner,
          icon: icons ? icons : req.Category.icon,
          slug: slug,
          adminCommission: adminCommission !== undefined ? adminCommission : req.Category.adminCommission,
        },
      },
      { new: true },
    );
    return res.status(200).json({
      success: true,
      message: "Category Update Successfully...",
      data: updateCategory,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    if (req.Category.icon) {
      deleteFileFromObjectStorage(req.Category.icon);
    }
    if (req.Category.banner) {
      req.Category.banner.map((o) => {
        deleteFileFromObjectStorage(o.url);
      });
    }
    let deleteCategory = await categoryModel.deleteOne({
      _id: req.Category._id,
    });
    return res.status(200).json({
      success: true,
      message: "Category Delete Successfully...",
      data: deleteCategory,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.disableCategory = async (req, res) => {
  try {
    let updateCategory = await categoryModel.findByIdAndUpdate(
      { _id: req.Category._id },
      {
        $set: {
          disable: !req.Category.disable,
        },
      },
      { new: true },
    );
    if (updateCategory.disable == true) {
      return res.status(200).json({
        success: true,
        message: "Category Successfully Disable...",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Category Successfully Enable...",
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.unLinks = async (req, res) => {
  try {
    let imageIndex = req.body.imageIndex;
    if (imageIndex) {
      for (let i = imageIndex - 1; i < req.Category.banner.length; i++) {
        console.log(req.Category.banner[i].url);
        deleteFileFromObjectStorage(req.Category.banner[i].url);
        req.Category.banner.splice(i, 1);
        let category = await categoryModel.findByIdAndUpdate(
          { _id: req.Category._id },
          { $set: { banner: req.Category.banner } },
          { new: true },
        );
        return res.status(200).json({
          success: true,
          message: "Image Is Unlink Successfully",
          data: category,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// exports.getAllCategoryByAdmin = async (req, res) => {
//   try {
//     let { page, disable } = req.query;
//     const startIndex = page ? (page - 1) * 20 : 0;
//     const endIndex = startIndex + 20;
//     let obj = {};
//     if (disable === "false" || disable === "true") {
//       obj.disable = disable;
//     }
//     let length = await categoryModel.countDocuments(obj);
//     let count = Math.ceil(length / 20);
//     let Category = await categoryModel
//       .find(obj)
//       .populate("pCategory")
//       .sort({ createdAt: -1 })
//       .skip(startIndex)
//       .limit(endIndex);
//     // if (!Category.length) {
//     //   return res.status(400).json({
//     //     success: false,
//     //     message: "Category Not Found",
//     //   });
//     // } else {
//     return res.status(200).json({
//       success: true,
//       message: "All Category Fatch Successfully...",
//       data: Category,
//       page: count,
//     });
//     // }
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// ======================= getAllCategoryWithPcategory ====================== ||
exports.getAllCategoryWithPcategory = async (req, res) => {
  let { disable, page } = req.query;
  const startIndex = page ? (page - 1) * 20 : 0;
  const endIndex = startIndex + 20;
  if (disable && disable != "true" && disable != "false") {
    return res
      .status(400)
      .send({ success: false, message: "disable must be true or false" });
  }
  let arr = [];
  if (disable == "false") {
    let data = await categoryModel.find({ pCategory: null, disable: false });
    for (let i = 0; i < data.length; i++) {
      let withSubcategory = await categoryModel.find({
        pCategory: data[i]._id,
        disable: false,
      });
      data[i]._doc.subCategory = withSubcategory;
      arr.push(data[i]);
    }
  } else if (disable == "true") {
    let data = await categoryModel.find({ pCategory: null });
    for (let i = 0; i < data.length; i++) {
      let withSubcategory = await categoryModel.find({
        pCategory: data[i]._id,
        disable: true,
      });
      if (withSubcategory.length > 0) {
        data[i]._doc.subCategory = withSubcategory;
        arr.push(data[i]);
      }
    }
  } else {
    let data = await categoryModel.find({ pCategory: null });
    for (let i = 0; i < data.length; i++) {
      let withSubcategory = await categoryModel.find({
        pCategory: data[i]._id,
      });
      data[i]._doc.subCategory = withSubcategory;
      arr.push(data[i]);
    }
  }

  let paginatedData = arr.slice(startIndex, endIndex);
  const count = Math.ceil(arr.length / 20);
  return res.status(200).send({
    success: false,
    message: "Category Fetched",
    data: paginatedData,
    page: count,
  });
};

// ===================== getAllNullPcategory ========================== ||
exports.getAllNullPcategory = async (req, res) => {
  try {
    let { page, disable } = req.query;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    let obj = { pCategory: null };
    if (disable === "false" || disable === "true") {
      obj.disable = disable;
    }
    let length = await categoryModel.countDocuments(obj);
    let count = Math.ceil(length / 20);
    const getAllCategorys = await categoryModel
      .find(obj)
      .sort({ createdAt: -1 });

    // if (!getAllCategorys.length) {
    //   return res.status(400).send({
    //     success: false,
    //     message: "Category Not Found",
    //   });
    // }
    return res.status(200).send({
      success: true,
      message: "All Null pCategory Is Fatch Successfully...",
      data: getAllCategorys,
      page: count,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// ======================= getAllCategoryWithPcategory ====================== ||
exports.getCategoryWithPcategory = async (req, res) => {
  try {
    let { page, disable } = req.query;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;

    let obj = { pCategory: req.params.pCategory };

    if (disable === "false" || disable === "true") {
      obj.disable = disable;
    }

    let length = await categoryModel.countDocuments(obj);
    let count = Math.ceil(length / 20);
    const getAllCategorys = await categoryModel
      .find(obj)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex)
      .populate("pCategory");

    // if (!getAllCategorys.length) {
    //   return res.status(400).send({
    //     success: false,
    //     message: "Sub Category Not Found",
    //   });
    // }

    return res.status(200).send({
      success: true,
      message: "Sub Category Is Fatch Successfully...",
      data: getAllCategorys,
      page: count,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// ======================= getAllCategoryWithPcategory ====================== ||

exports.getAllSubCategory = async (req, res) => {
  try {
    let { page, disable } = req.query;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    let obj = { pCategory: { $ne: null } };

    if (disable === "false" || disable === "true") {
      obj.disable = disable;
    }

    let length = await categoryModel.countDocuments(obj);
    let count = Math.ceil(length / 20);
    const getAllCategorys = await categoryModel
      .find(obj)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex)
      .populate("pCategory");
    // if (!getAllCategorys.length) {
    //   return res.status(400).send({
    //     success: false,
    //     message: "Sub Category Not Found",
    //   });
    // }
    return res.status(200).send({
      success: true,
      message: "Sub Category Is Fatch Successfully...",
      data: getAllCategorys,
      page: count,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// ======================= getAllCategoryWithPcategory ====================== ||
exports.getCategoryWithPcategoryByUser = async (req, res) => {
  try {
    let page = req.query.page;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    let length = await categoryModel.countDocuments({
      pCategory: req.params.pCategory,
      disable: false,
    });
    let count = Math.ceil(length / 20);
    const getAllCategorys = await categoryModel
      .find({ pCategory: req.params.pCategory, disable: false })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex)
      .populate("pCategory");
    // if (!getAllCategorys.length) {
    //   return res.status(400).send({
    //     success: false,
    //     message: "Sub Category Not Found",
    //   });
    // }
    return res.status(200).send({
      success: true,
      message: "Sub Category Is Fatch Successfully...",
      data: getAllCategorys,
      page: count,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

exports.getCategoryWithPcategoryByUserSlug = async (req, res) => {
  try {
    let page = req.query.page;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    const { slug } = req.query;
    const getCategory = await categoryModel.findOne({
      slug: slug,
      pCategory: null,
    });
    let length = await categoryModel.countDocuments({
      pCategory: getCategory?._id,
      disable: false,
    });
    let count = Math.ceil(length / 20);
    const getAllCategorys = await categoryModel
      .find({ pCategory: getCategory?._id, disable: false })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex)
      .populate("pCategory");

    return res.status(200).send({
      success: true,
      message: "Sub Category Is Fatch Successfully...",
      data: getAllCategorys,
      page: count,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// ======================= getAllCategoryWithPcategory ====================== ||
exports.getProductBySubCategory = async (req, res) => {
  try {
    let page = req.query.page;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    let length = await productModel.countDocuments({
      categoryId: req.Category._id,
      disable: false,
    });
    let count = Math.ceil(length / 20);
    const product = await productModel
      .find({ categoryId: req.Category._id, disable: false })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex)
      .populate("taxId categoryId");
    // if (!product.length) {
    //   return res.status(400).send({
    //     success: false,
    //     message: "product Not Found",
    //     data: [],
    //   });
    // }
    return res.status(200).send({
      success: true,
      message: "Product Is Fatch Successfully...",
      data: product,
      page: count,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

exports.getProductBySubCategorySlug = async (req, res) => {
  try {
    let page = req.query.page;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    const { slug } = req.query;
    const getCategory = await categoryModel.findOne({ slug: slug });
    let length = await productModel.countDocuments({
      categoryId: getCategory?._id,
      disable: false,
    });
    let count = Math.ceil(length / 20);
    const product = await productModel
      .find({ categoryId: getCategory?._id, disable: false })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex)
      .populate("taxId categoryId");

    return res.status(200).send({
      success: true,
      message: "Product Is Fatch Successfully...",
      data: product,
      page: count,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};
