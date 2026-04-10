const categoryModel = require("../models/categoryModel");

const updateParentCategoryRating = async (subCategoryId) => {
  const subCategory = await categoryModel.findById(subCategoryId);

  if (!subCategory || !subCategory.pCategory) return; // not a subcategory

  const parentId = subCategory.pCategory;

  // get all subcategories of this parent
  const subCategories = await categoryModel.find({
    pCategory: parentId,
    disable: false,
  });

  let totalReviews = 0;
  let totalRatingSum = 0;

  subCategories.forEach((sub) => {
    totalReviews += sub.totalRating;
    totalRatingSum += sub.avgRating * sub.totalRating;
  });

  const parentAvg =
    totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : 0;

  await categoryModel.findByIdAndUpdate(parentId, {
    avgRating: parentAvg,
    totalRating: totalReviews,
  });
};

module.exports = { updateParentCategoryRating };
