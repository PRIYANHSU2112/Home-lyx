const categoryModel = require("../models/categoryModel");
const productModel = require("../models/productModel");
const mongoose = require("mongoose");
const {
  deleteFileFromObjectStorage,
} = require("../midellwares/multerMidellware");
const {
  generateTransactionId,
  generateCategorySlug,
} = require("../helper/slugGenreted");

// exports.getByCategoryId = async (req, res) => {
//   try {
//     const { categoryId } = req.params;
//     console.log(categoryId);
//     const category = await categoryModel

//       .findById(new mongoose.Types.ObjectId(categoryId))
//       // .populate("pCategory") // parent category
//       // .populate("cityId") // city details
//       // .populate("reviews.userId"); // user details inside reviews

//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         message: "Category sdsdsds Not Found",
//         data: null,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Category fetched successfully",
//       data: category,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message + "sdsdsd",
//     });
//   }
// };

// exports.getCategoryId = async (req, res) => {
//   try {
//     const { categoryId } = req.params;
//      console.log("dsdsd")
//     if (!categoryId) {
//       return res.status(400).json({
//         success: false,
//         message: " categoryId  is required",
//       });
//     }

//     const category = await categoryModel.findById(categoryId);

//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         message: "Category not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Category fetched successfully",
//       data: category,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // 1️⃣ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid categoryId",
      });
    }

    // 2️⃣ Fetch category
    const category = await categoryModel
      .findById(categoryId)

      .populate("pCategory", "name slug")
      .populate("cityId", "cityName");

    //  Not found
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
        data: null,
      });
    }

    //  Success
    return res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      data: category,
    });
  } catch (error) {
    console.error("getCategoryById error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCategorySlug = async (req, res) => {
  try {
    const { slug } = req.query;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "slug is required",
      });
    }

    const category = await categoryModel.findOne({ slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Slug not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Fetched category successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// exports.getCategoryId = async (req, res, next, param) => {
//   try {
//     let category;

//     const isObjectId = /^[0-9a-fA-F]{24}$/.test(param); // Check if param is ObjectId

//     if (isObjectId) {
//       category = await categoryModel
//         .findById(param)
//         .populate("pCategory cityId");
//     } else {
//       category = await categoryModel
//         .findOne({ slug: param })
//         .populate("pCategory cityId");
//     }

//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         message: "Category not found",
//       });
//     }

//     req.Category = category;
//     next();
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// ========================== Create Category ================================== ||

// exports.createCategory = async (req, res) => {
//   try {
//     let icons;
//     let { name, pCategory, cityId } = req.body;
//     let arr = [];
//     console.log(req.files);
//     if (req.files) {
//       req.files.banner
//         ? req.files.banner.map((file) => {
//             if (file.mimetype == "video/mp4") {
//               let obj = {
//                 type: "VIDEO",
//                 url: file.key,
//               };
//               arr.push(obj);
//             }
//             if (
//               file.mimetype == "image/jpeg" ||
//               file.mimetype == "image/jpg" ||
//               file.mimetype == "image/png" ||
//               file.mimetype == "image/avif"
//             ) {
//               let obj = {
//                 type: "IMAGE",
//                 url: file.key,
//               };
//               arr.push(obj);
//             }
//             // else {
//             //   return res
//             //     .status(400)
//             //     .json({
//             //       success: false,
//             //       message: `this file type not valied ${file.mimetype}`,
//             //     });
//             // }
//           })
//         : null;
//       icons = req.files ? req.files.icon[0].key : null;
//     }
//     if (!icons) {
//       return res.status(400).json({
//         success: false,
//         message: "Icon Is Required...",
//       });
//     }
//     if (!name) {
//       return res.status(400).json({
//         success: false,
//         message: "Name Is Required...",
//       });
//     }
//     let fi;
//     if(pCategory){
//       fi = await categoryModel.findById(pCategory)
//     }
//     let slug;
//     if(!pCategory){
//     slug = await generateTransactionId("category", name?.toString()?.toLocaleLowerCase());
//     }else{
//     slug = await generateCategorySlug(`category`, fi?.name , "sub-categpry", name?.toString()?.toLocaleLowerCase());
//     }

//     let Category = await categoryModel.create({
//       name: name,
//       pCategory: pCategory,
//       banner: arr,
//       cityId: cityId,
//       icon: icons,
//       slug: slug,
//     });
//     return res.status(201).json({
//       success: true,
//       message: "Category Is Created Successfully...",
//       data: Category,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

exports.createCategory = async (req, res) => {
  try {
    const {
      name,
      pCategory,
      cityId,
      price,
      description,
      workExperience,
      status,
      disable,
      adminCharge,
    } = req.body;

    let bannerArr = [];
    let imagesArr = [];
    let videosArr = [];
    let icon = null;

    // -------- MEDIA HANDLING --------
    if (req.files) {
      if (req.files.icon?.length) {
        icon = req.files.icon[0].key;
      }

      if (req.files.banner?.length) {
        req.files.banner.forEach((file) => {
          bannerArr.push({
            type: file.mimetype === "video/mp4" ? "VIDEO" : "IMAGE",
            url: file.key,
          });
        });
      }

      if (req.files.images?.length) {
        imagesArr = req.files.images.map((file) => file.key);
      }

      if (req.files.videos?.length) {
        videosArr = req.files.videos.map((file) => file.key);
      }
    }

    // -------- VALIDATION --------
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // if (!icon) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Icon is required",
    //   });
    // }

    // -------- SLUG --------
    let slug;
    if (!pCategory) {
      slug = await generateTransactionId("category", name.toLowerCase());
    } else {
      const parent = await categoryModel.findById(pCategory);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Parent category not found",
        });
      }

      slug = await generateCategorySlug(
        "category",
        parent.name,
        "sub-category",
        name.toLowerCase(),
      );
    }

    // -------- ADMIN CHARGE --------
    // Only parent categories (pCategory=null) can have adminCharge set by admin
    // Sub-categories auto-inherit adminCharge from their parent
    let finalAdminCharge = 0;
    if (!pCategory) {
      // Parent category — admin can set adminCharge
      finalAdminCharge = adminCharge ? Number(adminCharge) : 0;
    } else {
      // Sub-category — inherit adminCharge from parent
      const parent = await categoryModel.findById(pCategory);
      finalAdminCharge = parent?.adminCharge || 0;
    }

    // -------- CREATE CATEGORY --------
    const category = await categoryModel.create({
      name,
      pCategory: pCategory || null,
      cityId,
      price,
      description,
      workExperience,
      status,
      disable,
      icon,
      banner: bannerArr,
      images: imagesArr,
      videos: videosArr,
      slug,
      adminCharge: finalAdminCharge,

      // ⭐ rating defaults
      totalRating: 0,
      avgRating: 0,
      reviews: [],
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================== Get By Id =================================== ||

exports.getByCategoryId = async (req, res) => {
  try {
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category  Not Found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category Fatch Successfully...",
      data: req.Category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + "sdsdsd",
    });
  }
};
// ============================== Get All ============================ ||

exports.getAllCategory = async (req, res) => {
  try {
    let page = req.query.page;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    let length = await categoryModel.countDocuments({ disable: false });
    let count = Math.ceil(length / 20);
    let Category = await categoryModel
      .find({ disable: false })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex)
      .populate("pCategory cityId");
    if (!Category.length) {
      return res.status(400).json({
        success: false,
        message: "Category Not Found",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "All Category Fatch Successfully...",
        data: Category,
        page: count,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================== Update Category ============================ ||

// exports.updateCategory = async (req, res) => {
//   try {
//     let { name, pCategory, cityId } = req.body;

//       const { categoryId } = req.params;
//      console.log("dsdsd")
//     if (!categoryId) {
//       return res.status(400).json({
//         success: false,
//         message: " categoryId  is required",
//       });
//     }

//     const category = await categoryModel.findById(categoryId);

//     let icons;
//     if (req.files) {
//       req.files.banner
//         ? req.files.banner.map((file) => {
//             if (file.mimetype == "video/mp4") {
//               let obj = {
//                 type: "VIDEO",
//                 url: file.key,
//               };
//               req.Category.banner.push(obj);
//             }
//             if (
//               file.mimetype == "image/jpeg" ||
//               file.mimetype == "image/avif" ||
//               file.mimetype == "image/jpeg" ||
//               file.mimetype == "image/png"
//             ) {
//               let obj = {
//                 type: "IMAGE",
//                 url: file.key,
//               };
//               req.Category.banner.push(obj);
//             }
//           })
//         : null;
//       icons = req.files.icon ? req.files.icon[0].key : null;
//     }
//     if (icons && req.Category.icon) {
//       deleteFileFromObjectStorage(req.Category.icon);
//     }
//     if (cityId && req.Category.cityId) {
//       if (typeof cityId == "string") {
//         req.Category.cityId.push(cityId);
//       } else {
//         cityId.map((o) => {
//           req.Category.cityId.push(o);
//         });
//       }
//     }
//     const slug = await generateTransactionId("category", name?.toString()?.toLocaleLowerCase());
//     let updateCategory = await categoryModel
//       .findByIdAndUpdate(
//         { _id: req.Category._id },
//         {
//           $set: {
//             name: name,
//             pCategory: pCategory,
//             banner: req.Category.banner,
//             icon: icons ? icons : req.Category.icon,
//             cityId: req.Category.cityId,
//             slug: slug
//           },
//         },
//         { new: true }
//       )
//       .populate("pCategory cityId");
//     return res.status(200).json({
//       success: true,
//       message: "Category Update Successfully...",
//       data: updateCategory,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// just Upadted code

// exports.updateCategory = async (req, res) => {
//   try {
//     const { name, pCategory, cityId } = req.body;
//     const categoryId  = req.params.categoryId;

//     if (!categoryId) {
//       return res.status(400).json({
//         success: false,
//         message: "categoryId is required",
//       });
//     }

//     const category = await categoryModel.findById(categoryId).populate("pCategory");
//     if (!category) {
//       return res.status(404).json({ success: false, message: "Category not found" });
//     }

//     let icons;
//     category.banner = Array.isArray(category.banner) ? category.banner : [];

//     if (req.files) {
//       if (req.files.banner) {
//         req.files.banner.forEach((file) => {
//           if (file.mimetype === "video/mp4") {
//             category.banner.push({ type: "VIDEO", url: file.key });
//           } else if (
//             file.mimetype === "image/jpeg" ||
//             file.mimetype === "image/png" ||
//             file.mimetype === "image/avif"
//           ) {
//             category.banner.push({ type: "IMAGE", url: file.key });
//           }
//         });
//       }
//       icons = req.files.icon ? req.files.icon[0].key : null;
//     }

//     if (icons && category.icon) {
//       deleteFileFromObjectStorage(category.icon);
//     }

//     if (cityId) {
//       if (typeof cityId === "string") {
//         category.cityId.push(cityId);
//       } else if (Array.isArray(cityId)) {
//         cityId.forEach((id) => category.cityId.push(id));
//       }
//     }
//     let slug;
//     if(!pCategory && !category?.pCategory){
//     slug = await generateTransactionId("category", name?.toString()?.toLocaleLowerCase());
//     }else{
//     slug = await generateCategorySlug(`category`, category?.pCategory?.name , "sub-categpry",name ? name?.toString()?.toLocaleLowerCase():category?.name);
//     }

//     const updatedCategory = await categoryModel.findByIdAndUpdate(
//       categoryId,
//       {
//         $set: {
//           name: name || category.name,
//           pCategory: pCategory || category.pCategory,
//           banner: category.banner,
//           icon: icons || category.icon,
//           cityId: category.cityId,
//           slug: slug,
//         },
//       },
//       { new: true }
//     ).populate("pCategory cityId");

//     return res.status(200).json({
//       success: true,
//       message: "Category Updated Successfully",
//       data: updatedCategory,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

exports.updateCategory = async (req, res) => {
  try {
    const {
      name,
      pCategory,
      cityId,
      price,
      description,
      workExperience,
      status,
      disable,
      adminCharge,
    } = req.body;

    const categoryId = req.params.categoryId;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "categoryId is required",
      });
    }

    const category = await categoryModel
      .findById(categoryId)
      .populate("pCategory");
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    let bannerArr = category.banner || [];
    let imagesArr = category.images || [];
    let videosArr = category.videos || [];
    let icon = category.icon;

    // -------- MEDIA HANDLING --------
    if (req.files) {
      // icon
      if (req.files.icon?.length) {
        if (category.icon) {
          deleteFileFromObjectStorage(category.icon);
        }
        icon = req.files.icon[0].key;
      }

      // banner
      if (req.files.banner?.length) {
        req.files.banner.forEach((file) => {
          bannerArr.push({
            type: file.mimetype === "video/mp4" ? "VIDEO" : "IMAGE",
            url: file.key,
          });
        });
      }

      // images
      if (req.files.images?.length) {
        imagesArr.push(...req.files.images.map((file) => file.key));
      }

      // videos
      if (req.files.videos?.length) {
        videosArr.push(...req.files.videos.map((file) => file.key));
      }
    }

    // -------- CITY HANDLING (avoid duplicates) --------
    let cityIds = category.cityId.map((id) => id.toString());
    if (cityId) {
      const incoming = Array.isArray(cityId) ? cityId : [cityId];
      incoming.forEach((id) => {
        if (!cityIds.includes(id.toString())) {
          cityIds.push(id);
        }
      });
    }

    // -------- SLUG --------
    let slug;
    if (!pCategory && !category.pCategory) {
      slug = await generateTransactionId(
        "category",
        (name || category.name).toLowerCase(),
      );
    } else {
      const parent = pCategory
        ? await categoryModel.findById(pCategory)
        : category.pCategory;

      slug = await generateCategorySlug(
        "category",
        parent?.name,
        "sub-category",
        (name || category.name).toLowerCase(),
      );
    }

    // -------- ADMIN CHARGE (only for parent categories) --------
    const effectivePCategory = pCategory ?? category.pCategory;
    let adminChargeUpdate = {};
    if (!effectivePCategory) {
      // Parent category — admin can update adminCharge
      if (adminCharge !== undefined) {
        adminChargeUpdate.adminCharge = Number(adminCharge);
      }
    }

    // -------- UPDATE CATEGORY --------
    const updatedCategory = await categoryModel
      .findByIdAndUpdate(
        categoryId,
        {
          $set: {
            name: name ?? category.name,
            pCategory: pCategory ?? category.pCategory,
            cityId: cityIds,
            price: price ?? category.price,
            description: description ?? category.description,
            workExperience: workExperience ?? category.workExperience,
            status: status ?? category.status,
            disable: disable ?? category.disable,
            icon,
            banner: bannerArr,
            images: imagesArr,  
            videos: videosArr,
            categoryStatus:"pending",
            slug,
            ...adminChargeUpdate,
          }, 
        },
        { new: true },
      )
      .populate("pCategory cityId");

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================== Delete Category ========================= ||

exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (category.icon) {
      deleteFileFromObjectStorage(category.icon);
    }

    if (category.banner && category.banner.length > 0) {
      category.banner.forEach((o) => {
        deleteFileFromObjectStorage(o.url);
      });
    }

    const deleteCategory = await categoryModel.deleteOne({
      _id: category._id,
    });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",

    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================ Disable Category ======================== ||

exports.toggleCategoryStatus = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // validation
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "categoryId is required",
      });
    }

    // find category first
    const category = await categoryModel.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // toggle disable value
    category.disable = !category.disable;
    await category.save();

    return res.status(200).json({
      success: true,
      message: category.disable
        ? "Category Disabled Successfully..."
        : "Category Enabled Successfully...",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




// ============ Unlink =============== ||

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

// ========================== Get By CityId ========================= ||

exports.getCityIdCategory = async (req, res) => {
  try {
    let page = req.query.page;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    let length = await categoryModel.countDocuments({
      cityId: req.params.cityId,
    });
    let count = Math.ceil(length / 20);
    let Category = await categoryModel
      .find({ cityId: req.params.cityId })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex)
      .populate("cityId")
      .populate("pCategory");
    if (!Category.length) {
      return res.status(400).json({
        success: false,
        message: "Category Not Found",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "All Category Fatch Successfully...",
        data: Category,
        page: count,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================== Get All ============================ ||

exports.getAllCategoryByAdmin = async (req, res) => {
  try {
    let { page = 1, limit = 20, disable } = req.query;

    // Convert to number
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    let filter = {};

    if (disable === "true" || disable === "false") {
      filter.disable = disable;
    }

    // Total count
    const total = await categoryModel.countDocuments(filter);

    // Fetch data
    const categories = await categoryModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("cityId")
      .populate("pCategory");

    return res.status(200).json({
      success: true,
      message: "All Categories fetched successfully",
      data: categories,
      pagination: {
        totalRecords: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        pageSize: limit,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
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
      .sort({ createdAt: -1 })
      .populate("cityId");
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
    let { page, disable, categoryStatus } = req.query;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;

    let obj = {
      pCategory: req.params.pCategory,
    };

    if (disable === "false" || disable === "true") {
      obj.disable = disable;
    }

    if (categoryStatus) {
      obj.categoryStatus = categoryStatus;
    }

    const [length, getAllCategorys] = await Promise.all([
      categoryModel.countDocuments(obj),
      categoryModel
        .find(obj)
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(endIndex)
        .populate("cityId")
        .populate("pCategory"),
    ]);
    let count = Math.ceil(length / 20);


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
      categoryStatus: "APPROVED",
    });
    let count = Math.ceil(length / 20);
    const getAllCategorys = await categoryModel
      .find({ pCategory: req.params.pCategory, disable: false })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex)
      .populate("cityId")
      .populate("pCategory");
    // if (!getAllCategorys.length) {
    //   return res.status(400).send({
    //     success: false,
    //     message: "Sub Category Not Found",
    //   });
    // }
    // console.log()
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
    const getCategorys = await categoryModel.findOne({
      slug: req.query.slug,
      pCategory: null,
    });
    let length = await categoryModel.countDocuments({
      pCategory: getCategorys?._id,
      disable: false,
    });
    let count = Math.ceil(length / 20);
    const getAllCategorys = await categoryModel
      .find({ pCategory: getCategorys?._id, disable: false })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex)
      .populate("cityId")
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
      .populate("taxId categoryId cityId");
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

// ======================= getAllCategoryWithPcategory ====================== ||
exports.getProductBySubCategorySlug = async (req, res) => {
  try {
    let page = req.query.page;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    const getCategorys = await categoryModel.findOne({ slug: req.query.slug });
    let length = await productModel.countDocuments({
      categoryId: getCategorys?._id,
      disable: false,
    });
    let count = Math.ceil(length / 20);
    const product = await productModel
      .find({ categoryId: getCategorys?._id, disable: false })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex)
      .populate("taxId categoryId cityId");

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

// ======================= getAllCategoryWithPcategory ====================== ||
exports.getAllSubCategory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const { disable, categoryStatus } = req.query;

    // Build filter object
    const filter = { pCategory: { $ne: null } };
    if (disable === "true" || disable === "false") {
      filter.disable = disable === "true";
    }
    if (categoryStatus) {
      filter.categoryStatus = categoryStatus;
    }

    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      categoryModel.countDocuments(filter),
      categoryModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("cityId", "cityName")
        .populate("pCategory", "name")
        .lean(),
    ]);

    return res.status(200).send({
      success: true,
      message: "Sub categories fetched successfully.",
      data,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        pageSize: limit,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// ==================== PARTNER ROUTES ====================

// Partner creates category (status: pending)
exports.partnerCreateCategory = async (req, res) => {
  try {
    const partnerId = req.partner._id;
    const {
      name,
      pCategory,
      cityId,
      price,
      description,
      workExperience,
    } = req.body;

    // Validate partnerId
    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid partnerId",
      });
    }

    // Partner cannot create parent category
    if (!pCategory) {
      return res.status(403).json({
        success: false,
        message: "Partner can only create sub-categories, not parent categories",
      });
    }

    // Verify parent category exists
    const parentCategory = await categoryModel.findById(pCategory);
    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        message: "Parent category not found",
      });
    }

    // Verify parent category is not created by partner
    if (parentCategory.partnerId) {
      return res.status(403).json({
        success: false,
        message: "Cannot use a partner-created category as parent",
      });
    }

    let bannerArr = [];
    let imagesArr = [];
    let videosArr = [];
    let icon = null;

    // -------- MEDIA HANDLING --------
    if (req.files) {
      if (req.files.icon?.length) {
        icon = req.files.icon[0].key;
      }

      if (req.files.banner?.length) {
        req.files.banner.forEach((file) => {
          bannerArr.push({
            type: file.mimetype === "video/mp4" ? "VIDEO" : "IMAGE",
            url: file.key,
          });
        });
      }

      if (req.files.images?.length) {
        imagesArr = req.files.images.map((file) => file.key);
      }

      if (req.files.videos?.length) {
        videosArr = req.files.videos.map((file) => file.key);
      }
    }

    // -------- VALIDATION --------
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // -------- SLUG --------
    const slug = await generateCategorySlug(
      "category",
      parentCategory.name,
      "sub-category",
      name.toLowerCase(),
    );

    // -------- ADMIN CHARGE (inherit from parent category) --------
    const finalAdminCharge = parentCategory.adminCharge || 0;

    // -------- CREATE CATEGORY (PENDING) --------
    const category = await categoryModel.create({
      name,
      pCategory,
      cityId,
      price,
      description,
      workExperience,
      icon,
      banner: bannerArr,
      images: imagesArr,
      videos: videosArr,
      slug,
      adminCharge: finalAdminCharge,
      partnerId: new mongoose.Types.ObjectId(partnerId),
      categoryStatus: "pending", // Set to pending for partner-created categories
      totalRating: 0,
      avgRating: 0,
      reviews: [],
    });

    return res.status(201).json({
      success: true,
      message:
        "Category created successfully. Awaiting admin approval.",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Partner get their own categories
exports.partnerGetMyCategories = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { page = 1, limit = 20, categoryStatus, disable, status } = req.query;

    // Validate partnerId
    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid partnerId",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = {
      partnerId: new mongoose.Types.ObjectId(partnerId),
    };

    if (categoryStatus) {
      filter.categoryStatus = categoryStatus;
    }

    if (disable !== undefined) {
      filter.disable = disable;
    }
    if (status) {
      filter.status = status;
    }
    const [total, categories] = await Promise.all([
      categoryModel.countDocuments(filter),
      categoryModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate("pCategory", "name")
        .populate("cityId", "cityName")
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      message: "Partner categories fetched successfully",
      data: categories,
      pagination: {
        totalRecords: total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        pageSize: parseInt(limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Partner update their own category (only if pending)
exports.partnerUpdateCategory = async (req, res) => {
  try {
    const { categoryId, partnerId } = req.params;
    const {
      name,
      pCategory,
      cityId,
      price,
      description,
      workExperience,
    } = req.body;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(categoryId) ||
      !mongoose.Types.ObjectId.isValid(partnerId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid categoryId or partnerId",
      });
    }

    const category = await categoryModel.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Verify ownership
    if (category.partnerId.toString() !== partnerId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own categories",
      });
    }

    // Can only update if pending
    if (category.categoryStatus !== "pending") {
      return res.status(403).json({
        success: false,
        message: `Cannot update ${category.categoryStatus} category. Only pending categories can be updated.`,
      });
    }

    let bannerArr = category.banner || [];
    let imagesArr = category.images || [];
    let videosArr = category.videos || [];
    let icon = category.icon;

    // -------- MEDIA HANDLING --------
    if (req.files) {
      if (req.files.icon?.length) {
        if (category.icon) {
          deleteFileFromObjectStorage(category.icon);
        }
        icon = req.files.icon[0].key;
      }

      if (req.files.banner?.length) {
        req.files.banner.forEach((file) => {
          bannerArr.push({
            type: file.mimetype === "video/mp4" ? "VIDEO" : "IMAGE",
            url: file.key,
          });
        });
      }

      if (req.files.images?.length) {
        imagesArr.push(...req.files.images.map((file) => file.key));
      }

      if (req.files.videos?.length) {
        videosArr.push(...req.files.videos.map((file) => file.key));
      }
    }

    // -------- UPDATE CATEGORY --------
    const updatedCategory = await categoryModel
      .findByIdAndUpdate(
        categoryId,
        {
          $set: {
            name: name ?? category.name,
            cityId: cityId || category.cityId,
            price: price ?? category.price,
            description: description ?? category.description,
            workExperience: workExperience ?? category.workExperience,
            icon,
            banner: bannerArr,
            images: imagesArr,
            videos: videosArr,
          },
        },
        { new: true },
      );

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Partner toggle disable/enable their own category
exports.partnerToggleDisable = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const partnerId = req.partner._id;

    // Validate categoryId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid categoryId",
      });
    }

    const category = await categoryModel.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Verify ownership
    if (category.partnerId.toString() !== partnerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only toggle your own categories",
      });
    }



    // Toggle disable status
    const updatedCategory = await categoryModel.findByIdAndUpdate(
      categoryId,
      { $set: { disable: !category.disable } },
      { new: true }
    );

    const message = updatedCategory.disable
      ? "Category successfully disabled"
      : "Category successfully enabled";

    return res.status(200).json({
      success: true,
      message,
      data: {
        categoryId: updatedCategory._id,
        disable: updatedCategory.disable,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================== ADMIN ROUTES ====================

// Admin get all pending categories
exports.adminGetPendingCategories = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await categoryModel.countDocuments({
      categoryStatus: "pending",
    });

    const categories = await categoryModel
      .find({ categoryStatus: "pending" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("partnerId", "name email")
      .populate("pCategory", "name")
      .populate("cityId", "cityName");

    return res.status(200).json({
      success: true,
      message: "Pending categories fetched successfully",
      data: categories,
      pagination: {
        totalRecords: total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        pageSize: parseInt(limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin approve category
exports.adminApproveCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid categoryId",
      });
    }

    const category = await categoryModel.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (category.categoryStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Category is already ${category.categoryStatus}`,
      });
    }

    const updatedCategory = await categoryModel
      .findByIdAndUpdate(
        categoryId,
        {
          $set: {
            categoryStatus: "approved",
            rejectionReason: null,
          },
        },
        { new: true },
      )
      .populate("partnerId", "name email")
      .populate("pCategory", "name")
      .populate("cityId", "cityName");

    return res.status(200).json({
      success: true,
      message: "Category approved successfully",
      data: updatedCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin reject category with reason
exports.adminRejectCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid categoryId",
      });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const category = await categoryModel.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (category.categoryStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a ${category.categoryStatus} category`,
      });
    }

    const updatedCategory = await categoryModel
      .findByIdAndUpdate(
        categoryId,
        {
          $set: {
            categoryStatus: "rejected",
            rejectionReason: reason.trim(),
          },
        },
        { new: true },
      )
      .populate("partnerId", "name email")
      .populate("pCategory", "name")
      .populate("cityId", "cityName");

    return res.status(200).json({
      success: true,
      message: "Category rejected successfully",
      data: updatedCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};