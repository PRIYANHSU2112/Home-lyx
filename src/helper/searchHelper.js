const Product = require("../models/ecommerce/productModel");
const Service = require("../models/categoryModel");

exports.searchData = async ({ q = "", page = 1, limit = 5 }) => {
  if (!q.trim()) {
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  const skip = (page - 1) * limit;

  // 🔍 PRODUCT SEARCH
  const productQuery = {
    $or: [
      { title: { $regex: q, $options: "i" } },
      { brandName: { $regex: q, $options: "i" } },
    ],
  };

  // 🔍 SERVICE SEARCH (FIXED)
  const serviceQuery = {
    name: { $regex: q, $options: "i" },
  };

  const [
    products,
    services,
    totalProducts,
    totalServices,
  ] = await Promise.all([
    Product.find(productQuery).skip(skip).limit(limit).lean(),
    Service.find(serviceQuery).skip(skip).limit(limit).lean(),
    Product.countDocuments(productQuery),
    Service.countDocuments(serviceQuery),
  ]);

  return {
    data: [
      ...products.map((p) => ({ ...p, type: "PRODUCT" })),
      ...services.map((s) => ({ ...s, type: "SERVICE" })),
    ],
    pagination: {
      page,
      limit,
      total: totalProducts + totalServices,
      totalPages: Math.ceil((totalProducts + totalServices) / limit),
    },
  };
};
