const productModel = require("../models/productModel");
const {
  deleteFileFromObjectStorage,
} = require("../midellwares/multerMidellware");
const reviewModel = require("../models/reviewModel");
const { generateTransactionId } = require("../helper/slugGenreted");

// ========================== Get Id =================================== ||

exports.getProductId = async (req, res, next, id) => {
  try {
    let Product = await productModel
      .findById(id)
      .populate("taxId categoryId cityId");
    if (!Product) {
      return res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
    } else {
      (req.Product = Product), next();
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Create Product ================================== ||

exports.createProduct = async (req, res) => {
  try {
    let {
      title,
      price,
      time,
      include,
      exclude,
      warranty,
      rateCard,
      categoryId,
      // pcategoryId,
      // cityId,
      subtitle,
      mrp,
      description,
      disable,
      taxId,
      sku,
      metaTitle,
      metaDescription,
      metaKeywords,
    } = req.body;
    let images = [];
    let additional = [];
    let thumnail;
    if (req.files) {
      req.files.images
        ? req.files.images.map((file) => {
            if (file.mimetype == "video/mp4") {
              let obj = {
                type: "VIDEO",
                url: file.key,
              };
              images.push(obj);
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
              images.push(obj);
            }
          })
        : null;
      req.files.additional
        ? req.files.additional.map((file) => {
            if (file.mimetype == "video/mp4") {
              let obj = {
                type: "VIDEO",
                url: file.key,
              };
              additional.push(obj);
            }
            if (file.mimetype == "image/jpeg") {
              let obj = {
                type: "IMAGE",
                url: file.key,
              };
              additional.push(obj);
            }
          })
        : null;
      thumnail = req.files.thumnail ? req.files.thumnail[0].key : null;
    }

    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "title is required..." });
    }
    if (!images.length) {
      return res
        .status(400)
        .json({ success: false, message: "images is required..." });
    }
    if (!price) {
      return res
        .status(400)
        .json({ success: false, message: "price is required..." });
    }
    if (!include) {
      return res
        .status(400)
        .json({ success: false, message: "include is required..." });
    }
    if (!exclude) {
      return res
        .status(400)
        .json({ success: false, message: "exclude is required..." });
    }
    if (!warranty) {
      return res
        .status(400)
        .json({ success: false, message: "warranty is required..." });
    }
    if (!categoryId) {
      return res
        .status(400)
        .json({ success: false, message: "categoryId is required..." });
    }
    // if (!pcategoryId) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: "pcategoryId is required..." });
    // }
    if (!mrp) {
      return res
        .status(400)
        .json({ success: false, message: "mrp is required..." });
    }
    if (!thumnail) {
      return res
        .status(400)
        .json({ success: false, message: "thumnail is required..." });
    }
    if (!time) {
      return res
        .status(400)
        .json({ success: false, message: "time is required..." });
    }
    // if (!cityId) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: "cityId is required..." });
    // }
    //if (!rateCard) {
    //  return res
    //   .status(400)
    //   .json({ success: false, message: "rateCard is required..." });
    //  }
    if (!description) {
      return res
        .status(400)
        .json({ success: false, message: "description is required..." });
    }
    if (sku) {
      let check = await productModel.find();
      for (let i = 0; i < check.length; i++) {
        if (check[i].sku) {
          if (check[i].sku == sku) {
            return res.status(400).json({
              success: false,
              mesasge: "Please Provide Unique sku",
            });
          }
        }
      }
    }
    let meta = {
      title: metaTitle,
      description: metaDescription,
      keywords: metaKeywords,
    };
    const slug = await generateTransactionId(
      "product",
      title?.toString()?.toLocaleLowerCase()
    );
    let Product = await productModel.create({
      sku: sku,
      title: title,
      price: price,
      time: time,
      include: include,
      exclude: exclude,
      warranty: warranty,
      description: description,
      rateCard: rateCard,
      categoryId: categoryId,
      // pcategoryId: pcategoryId,
      // cityId: cityId,
      subtitle: subtitle,
      mrp: mrp,
      disable: disable,
      additional: additional,
      images: images,
      taxId: taxId,
      thumnail: thumnail,
      meta: meta,
      slug: slug,
    });
    return res.status(201).json({
      success: true,
      message: "Product Is Created Successfully...",
      data: Product,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========================== Get By Id =================================== ||

exports.getByProductId = async (req, res) => {
  try {
    let page = req.query.page;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    let review = await reviewModel
      .find({ productId: req.Product._id })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex)
      .populate("userId");
    let length = await reviewModel.countDocuments({
      productId: req.Product._id,
    });
    let count = Math.ceil(length / 20);
    return res.status(200).json({
      success: true,
      message: "Product Fatch Successfully...",
      data: req.Product,
      review: review,
      reviewPage: count,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getByProductIdSlug = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    const startIndex = (page - 1) * 20;
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    const product = await productModel.findOne({ slug: slug.trim().toLowerCase() });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
    }

    let review = await reviewModel
      .find({ productId: product._id })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(20)
      .populate("userId");

    let length = await reviewModel.countDocuments({ productId: product._id });
    let count = Math.ceil(length / 20);

    return res.status(200).json({
      success: true,
      message: "Product Fetched Successfully",
      data: product,
      review: review,
      reviewPage: count,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================== Get All ============================ ||

exports.getAllProduct = async (req, res) => {
  try {
    let page = req.query.page;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    let Product = await productModel
      .find({ disable: false })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(endIndex)
      .populate("cityId categoryId taxId");
    let length = await productModel.countDocuments({ disable: false });
    let count = Math.ceil(length / 20);
    // if (!Product.length) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Product Not Found",
    //   });
    // } else {
    return res.status(200).json({
      success: true,
      message: "All Product Fatch Successfully...",
      data: Product,
      page: count,
    });
    // }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================== Update Product ============================ ||

exports.updateProduct = async (req, res) => {
  try {
    let Product = req.Product;
    let {
      title,
      price,
      time,
      include,
      exclude,
      warranty,
      description,
      rateCard,
      categoryId,
      // pcategoryId,
      cityId,
      subtitle,
      mrp,
      taxId,
      sku,
      metaTitle,
      metaDescription,
      metaKeywords,
    } = req.body;
    var thumnail;
    if (sku) {
      let check = await productModel.find();
      for (let i = 0; i < check.length; i++) {
        if (check[i].sku) {
          if (check[i].sku == sku) {
            if (check[i]._id.toString() == Product._id.toString()) {
              return res.status(400).json({
                success: false,
                mesasge: "Please Provide Unique sku",
              });
            }
          }
        }
      }
    }
    if (req.files) {
      req.files.images
        ? req.files.images.map((file) => {
            if (file.mimetype == "video/mp4") {
              let obj = {
                type: "VIDEO",
                url: file.key,
              };
              req.Product.images.push(obj);
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
              req.Product.images.push(obj);
            }
          })
        : null;
      req.files.additional
        ? req.files.additional.map((file) => {
            if (file.mimetype == "video/mp4") {
              let obj = {
                type: "VIDEO",
                url: file.key,
              };
              req.Product.additional.push(obj);
            }
            if (file.mimetype == "image/jpeg") {
              let obj = {
                type: "IMAGE",
                url: file.key,
              };
              req.Product.additional.push(obj);
            }
          })
        : null;
      thumnail = req.files.thumnail ? req.files.thumnail[0].key : null;
    }
    if (thumnail && req.Product.thumnail) {
      deleteFileFromObjectStorage(req.Product.thumnail);
    }
    let meta = {
      title: metaTitle,
      description: metaDescription,
      keywords: metaKeywords,
    };
    const slug = await generateTransactionId(
      "product",
      title?.toString()?.toLocaleLowerCase()
    );
    let updateProduct = await productModel
      .findByIdAndUpdate(
        { _id: Product._id },
        {
          $set: {
            title: title,
            price: price,
            time: time,
            include: include ? include : req.Product.include,
            exclude: exclude ? exclude : req.Product.exclude,
            warranty: warranty,
            rateCard: rateCard,
            description: description,
            categoryId: categoryId,
            // pcategoryId: pcategoryId,
            cityId: cityId,
            subtitle: subtitle,
            mrp: mrp,
            taxId: taxId,
            additional: req.Product.additional,
            images: req.Product.images,
            thumnail: thumnail ? thumnail : req.Product.thumnail,
            meta: meta,
            slug: slug,
          },
        },
        { new: true }
      )
      .populate("cityId categoryId taxId");
    return res.status(200).json({
      success: true,
      message: "Product Update Successfully...",
      data: updateProduct,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================== Delete Product ========================= ||

exports.deleteProduct = async (req, res) => {
  try {
    if (req.Product.thumnail) {
      deleteFileFromObjectStorage(req.Product.thumnail);
    }
    if (req.Product.images) {
      req.Product.images.map((o) => {
        deleteFileFromObjectStorage(o.url);
      });
    }
    if (req.Product.additional) {
      req.Product.additional.map((o) => {
        deleteFileFromObjectStorage(o.url);
      });
    }
    let deleteProduct = await productModel.deleteOne({
      _id: req.Product._id,
    });
    return res.status(200).json({
      success: true,
      message: "Product Delete Successfully...",
      data: deleteProduct,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================ Disable Product ======================== ||

exports.disableProduct = async (req, res) => {
  try {
    let updateProduct = await productModel.findByIdAndUpdate(
      { _id: req.Product._id },
      {
        $set: {
          disable: !req.Product.disable,
        },
      },
      { new: true }
    );
    if (updateProduct.disable == true) {
      return res.status(200).json({
        success: true,
        message: "Product Successfully Disable...",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Product Successfully Enable...",
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Unlink =============== ||

exports.productUnLinks = async (req, res) => {
  try {
    let imageIndex = req.body.imageIndex;
    let additionalIndex = req.body.additionalIndex;
    if (imageIndex) {
      console.log("udddd", req.Product);
      for (let i = imageIndex - 1; i < req.Product.images.length; i++) {
        console.log(req.Product.images[i].url);
        deleteFileFromObjectStorage(req.Product.images[i].url);
        req.Product.images.splice(i, 1);
        let Product = await productModel
          .findByIdAndUpdate(
            { _id: req.Product._id },
            { $set: { images: req.Product.images } },
            { new: true }
          )
          .populate("cityId categoryId taxId");
        return res.status(200).json({
          success: true,
          message: "Image Is Unlink Successfully",
          data: Product,
        });
      }
    }
    if (additionalIndex) {
      console.log(additionalIndex);
      for (
        let i = additionalIndex - 1;
        i < req.Product.additional.length;
        i++
      ) {
        deleteFileFromObjectStorage(req.Product.additional[i].url);
        req.Product.additional.splice(i, 1);
        let Product = await productModel
          .findByIdAndUpdate(
            { _id: req.Product._id },
            { $set: { additional: req.Product.additional } },
            { new: true }
          )
          .populate("cityId categoryId taxId");
        return res.status(200).json({
          success: true,
          message: "Image Is Unlink Successfully",
          data: Product,
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

// ============================== Filter Product =========================== ||

exports.filterProductByDate = async (req, res) => {
  try {
    const { filter, categoryId, cityId, price, search, disable } = req.query;
    let obj = {};
    let obj2 = {};
    if (req.filterQuery) {
      obj.createdAt = req.filterQuery;
    }
    if (categoryId) {
      obj.categoryId = categoryId;
    }
    if (cityId) {
      obj.cityId = cityId;
    }
    // if (productId) {
    //   obj._id = productId;
    // }
    if (disable) {
      obj.disable = disable;
    }
    if (req.query.price) {
      if (
        req.query.price != "low_to_high" &&
        req.query.price != "high_to_low"
      ) {
        return res.status(400).json({
          success: false,
          message: "'low_to_high', 'high_to_low' are the valid price options.",
        });
      } else {
        if ((req.query.price = "low-to-high")) {
          obj2.orderTotal = 1;
        } else if (req.query.price == "high-to-low") {
          obj2.orderTotal = -1;
        }
      }
    }

    obj2.createdAt = -1;

    let getData = await productModel
      .find(obj)
      .sort(obj2)
      .populate("cityId categoryId taxId");

    let datas = [];
    if (search) {
      if (req.query.search && req.query.search.length == 24) {
        datas = getData.filter((a) => {
          return a?._id == search;
        });
      } else if (req.query.search && datas.length == 0) {
        const regexSearch = new RegExp(search, "i");
        getData = getData.filter((e) => {
          return (
            regexSearch.test(e?.title) ||
            regexSearch.test(e?.subtitle) ||
            regexSearch.test(e?.include) ||
            regexSearch.test(e?.exclude)
          );
        });
      }
    }
    let page = req.query.page;
    const startIndex = page ? (page - 1) * 20 : 0;
    const endIndex = startIndex + 20;
    let length = getData.length;
    let count = Math.ceil(length / 20);
    let data = getData.slice(startIndex, endIndex);
    return res.status(200).json({
      success: true,
      message: "Product Is Filter Successfully...",
      data: datas.length != 0 ? datas : data,
      page: count,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
