const product = require("../../models/ecommerce/productModel");

exports.searchProducts = async (req, res) => {
  try {
    let { search } = req.query;
    let searchProduct = await product
      .find({ disable: false })
      .sort({createdAt : -1})
      .populate("categoryId brandId");
    if (search) {
      const regexSearch = new RegExp(search, "i");
      searchProduct = searchProduct.filter((e) => {
        return regexSearch.test(e?.title) || regexSearch.test(e?.subtitle);
      });
    }
     let page = req.query.page;
     const startIndex = page ? (page - 1) * 20 : 0;
     const endIndex = startIndex + 20;
     let length = searchProduct.length;
     let count = Math.ceil(length / 20);
     let data = searchProduct.slice(startIndex, endIndex);
    return res.status(200).json({
      success: true,
      message: "Search Services",
      data: {
        services: searchProduct,
        page: count,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
