const homeBannerModel = require("../../models/ecommerce/homeBannerModel");
const categoryModel = require("../../models/ecommerce/categoryModel");
const homeCategoryCartModel = require("../../models/ecommerce/homeCategoryCartModel");
const homeProductModel = require("../../models/ecommerce/homeProductModel");
const appBannerModel = require("../../models/ecommerce/appBannerModel");
// ======================= Home Page ======================= ||

exports.homePage = async (req, res) => {
  try {
   const [homeBanner, category, homeCategoryCart, homeProduct, appBanner] = await Promise.all([
  homeBannerModel.find(),
  categoryModel.find({ disable: false, pCategory: null }).sort({ createdAt: -1 }),
  homeCategoryCartModel.find().sort({ createdAt: -1 }),
  homeProductModel.find().populate([{ path: "products" }]).sort({ createdAt: -1 }),
  appBannerModel.find().sort({ createdAt: -1 }),
]);
    return res.status(200).json({
      success: true,
      message: "HomePage Fatch",
      data: {
        homeBanner: homeBanner,
        category: category,
        homeCategoryCart: homeCategoryCart,
        product: homeProduct,
        appBanner: appBanner,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
