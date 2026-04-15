const HomeBanner = require("../models/ecommerce/homeBannerModel");
const Category = require("../models/ecommerce/categoryModel");
const Service = require("../models/categoryModel");
const Product = require("../models/ecommerce/productModel");
const orderModel = require("../models/ecommerce/orderModel");
const cartModel = require("../models/ecommerce/CartModel");
const userModel = require("../models/userModel");
const mongoose = require("mongoose");

exports.getHomeData = async (req, res) => {
  try {
    const [banners, categories, services] = await Promise.all([
      HomeBanner.find({ disable: false })
        .select("title banner")
        .sort({ createdAt: -1 }),

      Category.find({ disable: false })
        .select("_id name icon")
        .lean(),

      Service.aggregate([
        { $match: { disable: false } },
        {
          $lookup: {
            from: "categorymodels",
            localField: "_id",
            foreignField: "pCategory",
            as: "children",
          },
        },
        { $match: { "children.0": { $exists: true } } },
        {
          $project: {
            name: 1,
            icon: 1,
            slug: 1,
            avgRating: 1,
            totalRating: 1,
            description: 1,
          },
        },
      ])
    ]);




    /*  Products grouped by categoryId */
    const products = await Product.find({
      categoryId: { $in: categories.map(c => c._id) },
      disable: false,
      status: "APPROVED",
    })
      .select("title subtitle variants features thumnail slug reviewRating brandName categoryId")
      .lean();

    const categoryProducts = categories.map(cat => ({
      categoryId: cat._id,
      categoryName: cat.name,
      products: products.filter(p => p.categoryId.equals(cat._id)).slice(0, 6)
    }));


    return res.status(200).json({
      success: true,
      message: "Home data fetched successfully",
      data: {
        banners,
        categories,
        services,
        categoryProducts,
      },
    });

  } catch (error) {
    console.error("Home API Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


exports.getUserSummary = async (req, res) => {
  try {
    if (!req.User || !req.User._id) {
      return res.status(200).json({
        success: true,
        data: {
          cartCount: 0,
          profileImage: null,
        },
      });
    }

    const userId = req.User._id;

    const [cart, user] = await Promise.all([
      cartModel.findOne({ customerId: userId }, { items: 1 }).lean(),
      userModel.findById(userId).select("image"),
    ]);

    return res.status(200).json({
      success: true,
      message: "User summary fetched successfully",
      data: {
        cartCount: cart?.items?.length || 0,
        profileImage: user?.image || null,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



exports.getHomeService = async (req, res) => {
  try {
    const { userId } = req.query;
    // const userObjectId = new mongoose.Types.ObjectId(userId);
    //       console.log("userId:", userId);
    // console.log("isValid:", mongoose.Types.ObjectId.isValid(userId));

    let personalizedServices = [];

    // Early exit (fast)
    if (userId || userObjectId) {


      //  Latest order (only first product, minimal fields)
      const latestOrder = await orderModel.findOne(
        {
          customerId: userId,
          status: { $nin: ["CANCELLED", "DELIVERED", "RETURN_REQUEST", "RETURN_REQUEST_APPROVED", "RETURNED"] }
        },
        { product: { $slice: 1 } } // only first product
      )
        .sort({ createdAt: -1 })
        .populate({
          path: "product.productId",
          select: "categoryId",
          populate: {
            path: "categoryId",
            select: "name",
          },
        })
        .lean();

      if (
        !latestOrder?.product?.length ||
        !latestOrder.product[0].productId?.categoryId?.name
      ) {
        return res.status(200).json({
          success: true,
          message: "Personalized services fetched successfully",
          data: { personalizedServices },
        });
      }

      //  Product category name
      const productCategoryName =
        latestOrder.product[0].productId.categoryId.name;
      // console.log("Product Category Name:", productCategoryName);

      //  SAME-NAME SERVICE category IDs (indexed)
      const serviceParentIds = await Service.find(
        { name: productCategoryName, disable: false },
        { _id: 1 }
      ).lean();
      // console.log("Service Parent IDs:", serviceParentIds);
      if (!serviceParentIds.length) {
        return res.status(200).json({
          success: true,
          message: "Personalized services fetched successfully",
          data: { personalizedServices },
        });
      }

      // Child services (final query)
      personalizedServices = await Service.find(
        {
          pCategory: { $in: serviceParentIds.map(s => s._id) },
          disable: false,
        },
        {
          name: 1,
          icon: 1,
          slug: 1,
          avgRating: 1,
          totalRating: 1,
          description: 1,
          price: 1,
        }
      ).lean();
    }

    return res.status(200).json({
      success: true,
      message: "Personalized services fetched successfully",
      data: { personalizedServices },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const bookingModel = require("../models/bookingModel");

// =================== Partner Dashboards Stats APIs =================== //

exports.getPartnerOrderStats = async (req, res) => {
  try {
    const { partnerId } = req.query;
    if (!partnerId) {
      return res.status(400).json({ success: false, message: "partnerId is required in query" });
    }

    const [pending, accepted, completed, allOrders, lowStockProducts] = await Promise.all([
      orderModel.countDocuments({ partnerId, status: "PENDING" }),
      orderModel.countDocuments({ partnerId, status: "ACCEPTED"}),
      orderModel.countDocuments({ partnerId, status: "DELIVERED" }),
      orderModel.countDocuments({ partnerId }),
      Product.find({
        partnerId,
        $or: [
          { "variants.stock": { $lt: 50 } },
          { stock: { $lt: 50 } }
        ]
      }).select("title thumnail variants stock brandName sku status disable").limit(5).lean()
    ]);

    const calculatePercent = (count, total) => total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0;

    return res.status(200).json({
      success: true,
      data: {
        pending: { count: pending, percentage: calculatePercent(pending, allOrders) },
        accepted: { count: accepted, percentage: calculatePercent(accepted, allOrders) },
        completed: { count: completed, percentage: calculatePercent(completed, allOrders) },
        allOrders: { count: allOrders, percentage: 100 },
        lowStockProducts
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPartnerBookingStats = async (req, res) => {
  try {
    const { partnerId } = req.query;
    if (!partnerId) {
      return res.status(400).json({ success: false, message: "partnerId is required in query" });
    }

    const [pending, accepted, completed, allOrders, upcomingBookings] = await Promise.all([
      bookingModel.countDocuments({ partnerId, partnerBookingStatus: "PENDING" }),
      bookingModel.countDocuments({ partnerId, partnerBookingStatus: "ACCEPTED"}),
      bookingModel.countDocuments({ partnerId, bookingStatus: "COMPLETED" }),
      bookingModel.countDocuments({ partnerId }),
      bookingModel.find({ 
        partnerId, 
        partnerBookingStatus: "ACCEPTED", 
        bookingStatus: { $nin: ["COMPLETED", "CANCELLED"] } 
      })
      .select("serviceDate serviceTimeSlot finalPayableAmount bookingStatus paymentStatus serviceLocation userId subCategoryId")
      .populate("userId", "name phone image")
      .populate("subCategoryId", "name icon")
      .sort({ serviceDate: 1 })
      .limit(5)
      .lean()
    ]);

    const calculatePercent = (count, total) => total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0;

    return res.status(200).json({
      success: true,
      data: {
        pending: { count: pending, percentage: calculatePercent(pending, allOrders) },
        accepted: { count: accepted, percentage: calculatePercent(accepted, allOrders) },
        completed: { count: completed, percentage: calculatePercent(completed, allOrders) },
        allOrders: { count: allOrders, percentage: 100 },
        upcomingBookings
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};