const productModel = require("../../models/ecommerce/productModel");
const {
  deleteFileFromObjectStorage,
} = require("../../midellwares/multerMidellware");
const reviewModel = require("../../models/ecommerce/reviewModel");
const taxModel = require("../../models/taxModel");
const brandModel = require("../../models/ecommerce/brandModel");
const { generateTransactionId } = require("../../helper/slugGenreted");
const { calculatePrice } = require("../../helper/priceCount");
const { size } = require("lodash");
const { validateVariants } = require("../../validators/variantValidetor");
const mongoose = require("mongoose");

// ========================== Get Id =================================== ||

exports.getProductId = async (req, res, next, id) => {
  try {
    let Product = await productModel
      .findById(id)
      .populate("taxId categoryId brandId");
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
    const {
      title, time, features, warranty, categoryId,
      // taxId is now fetched automatically
      subtitle, disable, brandId, description,
      sku, returnInDays, metaTitle, metaDescription,
      metaKeywords, highlights, specifications, variants, brandName
    } = req.body;

    const partnerId = req.partner._id;

    const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/avif"]);

    const toMediaObject = (file) => ({
      type: file.mimetype === "video/mp4" ? "VIDEO" : "IMAGE",
      url: file.key,
    });

    const filterMediaFiles = (files) =>
      (files || []).filter(
        (f) => f.mimetype === "video/mp4" || ALLOWED_IMAGE_TYPES.has(f.mimetype)
      ).map(toMediaObject);

    const images    = filterMediaFiles(req.files?.images);
    const additional = filterMediaFiles(req.files?.additional);
    const thumnail  = req.files?.thumnail?.[0]?.key ?? null;

    const variantError = await validateVariants(variants);
    if (variantError) return res.status(400).json({ success: false, message: variantError });

    const requiredFields = [
      [title,          "title"],
      [features,       "features"],
      [warranty,       "warranty"],
      [categoryId,     "categoryId"],
      [thumnail,       "thumnail"],
      [time,           "time"],
      [brandId,        "brandId"],
      [brandName,      "brandName"],
      [description,    "description"],
    ];

    for (const [value, name] of requiredFields) {
      if (!value) return res.status(400).json({ success: false, message: `${name} is required...` });
    }

    if (!images.length)
      return res.status(400).json({ success: false, message: "images is required..." });

    // ── Automated Latest Tax Lookup ──────────────────────────────────
    const tax = await taxModel.findOne().sort({ createdAt: -1 });
    if (!tax) return res.status(404).json({ 
      success: false, 
      message: "No tax records found. Please create a tax record first." 
    });

    const taxId = tax._id;

    // ── SKU Uniqueness Check ─────────────────────────────────────────
    if (sku) {
      const skuExists = await productModel.exists({ sku });
      if (skuExists)
        return res.status(400).json({ success: false, message: "Please Provide Unique sku" });
    }

    // ── Build & Save Product ─────────────────────────────────────────
    const slug = await generateTransactionId("product", title.toString().toLocaleLowerCase());

    const preVariant = variants.map(({ size, mrp, discount = 0, stock }) => ({
      size,
      mrp,
      discount,
      price: calculatePrice({ mrp, discount }),
      stock,
    }));

    const Product = await productModel.create({
      title, time, features, warranty, categoryId,
      taxId, taxPercent: tax.taxPercent,
      partnerId, status: partnerId ? "PENDING" : "APPROVED",
      subtitle, disable,
      images, additional, thumnail,
      description, brandId, brandName,
      returnInDays, highlights, specifications,
      slug, sku, variants: preVariant,
      meta: { title: metaTitle, description: metaDescription, keywords: metaKeywords },
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
    const { value } = req.params;
    const { size, limit: rawLimit } = req.query;

    const limit = parseInt(rawLimit) || 20;

    const product = await (
      mongoose.Types.ObjectId.isValid(value)
        ? productModel.findById(value)
        : productModel.findOne({ slug: value })
    );

    if (!product)
      return res.status(401).json({ success: false, message: "Product not found" });

    let selectVarient = product.variants.find((v) => v.stock > 0) ?? product.variants[0];

    if (size) {
      const bySize = product.variants.find((v) => v.size === size);
      if (bySize) selectVarient = bySize;
    }

    const similarProduct = await productModel
      .find({ _id: { $ne: product._id }, categoryId: product.categoryId, disable: false })
      .select("title slug variants thumnail brandName reviewRating subtitle features")
      .sort({ createdAt: -1 })
      .limit(limit);

    const {
      _id, title, subtitle, time, features, warranty,
      categoryId, taxId, taxPercent, brandId, brandName,
      images, additional, thumnail, description, highlights,
      specifications, sku, slug, reviewRating, returnInDays,
      meta, variants, disable, createdAt,
    } = product;

    return res.status(200).json({
      success: true,
      data: {
        _id, title, subtitle, time, features, warranty,
        categoryId, taxId, taxPercent, brandId, brandName,
        images, additional, thumnail, description, highlights,
        specifications, sku, slug, reviewRating, returnInDays,
        meta, variants, disable, createdAt,
        selectVarient,
        similarProduct,
      },
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


exports.getByProductIdPartner = async (req, res) => {
  try {
    const { value } = req.params;
    const { size, limit: rawLimit } = req.query;

    const limit = parseInt(rawLimit) || 20;

    const product = await (
      mongoose.Types.ObjectId.isValid(value)
        ? productModel.findById(value)
        : productModel.findOne({ slug: value })
    );

    if (!product)
      return res.status(401).json({ success: false, message: "Product not found" });

    let selectVarient = product.variants.find((v) => v.stock > 0) ?? product.variants[0];

    if (size) {
      const bySize = product.variants.find((v) => v.size === size);
      if (bySize) selectVarient = bySize;
    }

    const {
      _id, title, subtitle, time, features, warranty,
      categoryId, taxId, taxPercent, brandId, brandName,
      images, additional, thumnail, description, highlights,
      specifications, sku, slug, reviewRating, returnInDays,
      meta, variants, disable, createdAt,
    } = product;

    return res.status(200).json({
      success: true,
      data: {
        _id, title, subtitle, time, features, warranty,
        categoryId, taxId, taxPercent, brandId, brandName,
        images, additional, thumnail, description, highlights,
        specifications, sku, slug, reviewRating, returnInDays,
        meta, variants, disable, createdAt,
        selectVarient,
      },
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// exports.getByProductIdSlug = async (req, res) => {
//   try {
//     let page = req.query.page;
//     const startIndex = page ? (page - 1) * 20 : 0;
//     const endIndex = startIndex + 20;
//     const { slug } = req.params;
//     const getProduct = await productModel
//       .findOne({ slug: slug })
//       .populate("categoryId brandId");
//     let length = await reviewModel.countDocuments({
//       productId: getProduct?._id,
//     });
//     let count = Math.ceil(length / 20);
//     let review = await reviewModel
//       .find({ productId: getProduct?._id })
//       .sort({ createdAt: -1 })
//       .skip(startIndex)
//       .limit(endIndex)
//       .populate("userId");
//     return res.status(200).json({
//       success: true,
//       message: "Product Fatch Successfully...",
//       data: getProduct,
//       review: review,
//       reviewPage: count,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };
// ============================== Get All ============================ ||

exports.getAllProduct = async (req, res) => {
  try {

    const {
      search,
      minPrice,
      maxPrice,
      size,
      finish,
      features,
      usage,
      sortBy,
      page = 1,
      limit = 10,
      brandName,
      categoryId,
      disable
    } = req.query;

    const query = {};
    const skip = (page - 1) * limit;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subtitle: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }]
    }
    if (minPrice || maxPrice) {
      query["variants.price"] = {};

      if (minPrice) {
        query["variants.price"].$gte = Number(minPrice);
      }

      if (maxPrice) {
        query["variants.price"].$lte = Number(maxPrice);
      }
    }

    if (size) {
      query["variants.size"] = size;
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }
    if (brandName) {
      query.brandName = brandName;
    }

    if (features) {
      query.features = { $in: features.split(",") };
    }

    if (finish || usage) {
      query.specifications = {
        $elemMatch: {
          value: { $regex: finish || usage, $options: "i" }
        }
      }
    }

    if (disable !== undefined) {
      query.disable = disable === "true";
    }

    // console.log(query)
    let [Product, totalProducts] = await Promise.all([
      productModel
        .find(query, { __v: 0 })          // exclude unnecessary fields
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),                           // returns plain JS objects (faster)

      productModel.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      message: "All Product Fatch Successfully...",
      totalProducts,
      data: Product,

    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllProductByBrandId = async (req, res) => {
  try {

    const {
      search,
      minPrice,
      maxPrice,
      size,
      finish,
      features,
      usage,
      page = 1,
      limit = 10
    } = req.query;
    const brandId = req.params.brandId;

    const query = {
      brandId: brandId,
      disable: false
    }
    const skip = (page - 1) * limit;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subtitle: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }]
    }
    if (minPrice || maxPrice) {
      query["variants.price"] = {};

      if (minPrice) {
        query["variants.price"].$gte = Number(minPrice);
      }

      if (maxPrice) {
        query["variants.price"].$lte = Number(maxPrice);
      }
    }

    if (size) {
      query["variants.size"] = size;
    }

    if (features) {
      query.features = { $in: features.split(",") };
    }

    if (finish || usage) {
      query.specifications = {
        $elemMatch: {
          value: { $regex: finish || usage, $options: "i" }
        }
      }
    }

    // console.log(query)
    let Product = await productModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    let totalProducts = await productModel.countDocuments(query);
    return res.status(200).json({
      success: true,
      message: "All Product Fatch Successfully...",
      totalProducts,
      data: Product,

    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllProductByCategoryId = async (req, res) => {
  try {

    const {
      search,
      minPrice,
      maxPrice,
      size,
      finish,
      features,
      usage,
      sortBy,
      page = 1,
      limit = 10
    } = req.query;
    const categoryId = req.params.categoryId;

    const query = {
      categoryId,
      disable: false
    }
    const skip = (page - 1) * limit;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subtitle: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }]
    }
    if (minPrice || maxPrice) {
      query["variants.price"] = {};

      if (minPrice) {
        query["variants.price"].$gte = Number(minPrice);
      }

      if (maxPrice) {
        query["variants.price"].$lte = Number(maxPrice);
      }
    }

    if (size) {
      query["variants.size"] = size;
    }

    if (features) {
      query.features = { $in: features.split(",") };
    }

    // if (finish || usage) {
    //   query.specifications = {
    //     $elemMatch: {
    //       value: { $regex: finish || usage, $options: "i" }
    //     }
    //   }
    // }

    console.log(query)
    let Product = await productModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("title brandName slug variants reviewRating thumnail features ");

    let totalProducts = await productModel.countDocuments(query);
    return res.status(200).json({
      success: true,
      message: "All Product Fatch Successfully...",
      totalProducts,
      data: Product,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalProducts / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllProductByPartnerId = async (req, res) => {
  try {
    const partnerId = req.partner._id;
    const { search, page = 1, limit = 10, status, categoryId, brandId } = req.query;
    const skip = (page - 1) * limit;

    const query = { partnerId };

    if (status) {
      query.status = status;
    }
    if (categoryId) {
      query.categoryId = categoryId;
    }
    if (brandId) {
      query.brandId = brandId;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subtitle: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [products, totalProducts] = await Promise.all([
      productModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))  
        .lean(),
      productModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      totalProducts,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================== Update Product ============================ ||


exports.updateProduct = async (req, res) => {
  try {
    const product = req.Product;


    const {
      title,
      time,
      features,
      warranty,
      categoryId,
      taxId,
      subtitle,
      disable,
      brandId,
      brandName,
      description,
      sku,
      returnInDays,
      metaTitle,
      metaDescription,
      metaKeywords,
      highlights,
      specifications,
      variants,
      removeImages // array of image keys
    } = req.body;

    /* ================= VARIANT VALIDATION ================= */
    if (variants !== undefined) {
      const error = validateVariants(variants);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error
        });
      }
    }

    /* ================= SKU UNIQUE CHECK ================= */
    if (sku && sku !== product.sku) {
      const exists = await productModel.findOne({ sku });
      if (exists) {
        return res.status(409).json({
          success: false,
          message: "SKU must be unique"
        });
      }
    }

    /* ================= BUILD UPDATE QUERY ================= */
    const updateQuery = {};
    const setData = {};
    const pushData = {};
    const pullData = {};

    /* ---------- BASIC FIELDS ---------- */
    if (title !== undefined) setData.title = title;
    if (time !== undefined) setData.time = time;
    if (features !== undefined) setData.features = features;
    if (warranty !== undefined) setData.warranty = warranty;
    if (categoryId !== undefined) setData.categoryId = categoryId;
    if (taxId !== undefined) {
      const tax = await taxModel.findById(taxId);
      if (tax) {
        setData.taxId = taxId;
        setData.taxPercent = tax.taxPercent;
      } else {
        return res.status(404).json({ success: false, message: "Tax record not found" });
      }
    }
    if (subtitle !== undefined) setData.subtitle = subtitle;
    if (disable !== undefined) setData.disable = disable;
    if (brandId !== undefined) setData.brandId = brandId;
    if (description !== undefined) setData.description = description;
    if (brandName !== undefined) setData.brandName = brandName;
    if (sku !== undefined) setData.sku = sku;
    if (returnInDays !== undefined) setData.returnInDays = returnInDays;
    if (highlights !== undefined) setData.highlights = highlights;
    if (specifications !== undefined) setData.specifications = specifications;

    /* ---------- META ---------- */
    if (metaTitle || metaDescription || metaKeywords) {
      setData.meta = {
        ...(metaTitle !== undefined && { title: metaTitle }),
        ...(metaDescription !== undefined && { description: metaDescription }),
        ...(metaKeywords !== undefined && { keywords: metaKeywords })
      };
    }

    if (variants !== undefined) {
      setData.variants = variants.map(v => {
        const mrp = Number(v.mrp);
        const discount = Number(v.discount || 0);

        return {
          size: v.size,
          mrp,
          discount,
          price: calculatePrice({ mrp, discount }),
          stock: Number(v.stock)
        };
      });
    }

    if (req.files?.thumnail?.length) {
      const newThumb = req.files.thumnail[0].key;
      if (product.thumnail) {
        deleteFileFromObjectStorage(product.thumnail);
      }
      setData.thumnail = newThumb;
    }

    if (req.files?.images?.length) {
      const newImages = req.files.images.map(file => ({
        type: file.mimetype.startsWith("video") ? "VIDEO" : "IMAGE",
        url: file.key
      }));

      pushData.images = { $each: newImages };
    }

    if (Array.isArray(removeImages) && removeImages.length) {
      pullData.images = { url: { $in: removeImages } };

      // delete from storage
      removeImages.forEach(key => deleteFileFromObjectStorage(key));
    }

    /* ---------- SLUG ---------- */
    if (title) {
      setData.slug = await generateTransactionId(
        "product",
        title.toLowerCase()
      );
    }

    /* ================= FINAL QUERY ================= */
    if (Object.keys(setData).length) updateQuery.$set = setData;
    if (Object.keys(pushData).length) updateQuery.$push = pushData;
    if (Object.keys(pullData).length) updateQuery.$pull = pullData;

    const updatedProduct = await productModel.findByIdAndUpdate(
      product._id,
      updateQuery,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
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
//==================        Update Stoke     =====================================  ||
exports.updateStoke = async (req, res) => {
  let stock = req.body;
  if (stock <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "stock must be greater or equal to 0" });
  }
  let updateStoke = await productModel.findOneAndUpdate(
    { _id: req.Product._id },
    {
      $set: { stock: stock },
    }
  );
  return res.status(200).send({
    success: true,
    message: "stock update successfully",
    data: updateStoke,
  });
};

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
      for (let i = imageIndex - 1; i < req.Product.images.length; i++) {
        console.log(req.Product.images[i].url);
        deleteFileFromObjectStorage(req.Product.images[i].url);
        req.Product.images.splice(i, 1);
        let Product = await productModel.findByIdAndUpdate(
          { _id: req.Product._id },
          { $set: { images: req.Product.images } },
          { new: true }
        );
        return res.status(200).json({
          success: true,
          message: "Image Is Unlink Successfully",
          data: Product,
        });
      }
    }
    if (additionalIndex) {
      for (
        let i = additionalIndex - 1;
        i < req.Product.additional.length;
        i++
      ) {
        deleteFileFromObjectStorage(req.Product.additional[i].url);
        req.Product.additional.splice(i, 1);
        let Product = await productModel.findByIdAndUpdate(
          { _id: req.Product._id },
          { $set: { additional: req.Product.additional } },
          { new: true }
        );
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
    const { filter, categoryId, taxId, disable, search } = req.query;
    let obj = {};
    let obj2 = {};
    if (req.filterQuery) {
      obj.createdAt = req.filterQuery;
    }
    if (categoryId) {
      obj.categoryId = categoryId;
    }
    if (taxId) {
      obj.taxId = taxId;
    }
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
      .populate("categoryId taxId brandId");
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
            regexSearch.test(e?.features)
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

exports.updateProductStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const product = req.Product;

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Use APPROVED or REJECTED.",
      });
    }

    if (status === "REJECTED" && !reason) {
      return res.status(400).json({
        success: false,
        message: "Reason is required for rejection.",
      });
    }

    const updateData = { status };
    if (status === "REJECTED") {
      updateData.reason = reason;
    } else {
      updateData.reason = ""; // Clear reason if approved
    }

    const updatedProduct = await productModel.findByIdAndUpdate(
      product._id,
      { $set: updateData },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: `Product ${status.toLowerCase()} successfully.`,
      data: updatedProduct,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};




