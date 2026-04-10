const Service = require("../models/categoryModel");
const { searchData } = require("../helper/searchHelper");

exports.searchServices = async (req, res) => {
  try {
    let { cityId, search, page = 1, limit = 5 } = req.query;

    page = Number(page);
    limit = Number(limit);

    let query = {
      disable: false,
      ...(cityId && { cityId }),
      ...(search && {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      }),
    };

    const total = await Service.countDocuments(query);

    const services = await Service.find(query)
      .populate("pCategory")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      message: "Search Services",
      data: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        services,s
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.globalSearch = async (req, res) => {
  const { q, page, limit } = req.query;

  if (!q) {
    return res.status(400).json({ message: "Search query required" });
  }

  const data = await searchData({
    q,
    page: Number(page) || 1,
    limit: Number(limit) || 5,
  });

  res.status(200).json({ success: true, data });
};
