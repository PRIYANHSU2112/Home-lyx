const mongoose = require("mongoose");
let objectId = mongoose.Types.ObjectId;

const eCommerceHomeCatergoryCartModel = mongoose.Schema(
  {
    title: String,
    subtitle: String,
    image: String,
    backgroundColourCode: String,
    taskColourCode: String,
    pCategory: { type: objectId, ref: "eCommerceCategoryModel"},
    category: { type: objectId, ref: "eCommerceCategoryModel"},
    slug:{
      type:String
    }
  },
  { timestamps: true }
);

// Add indexes for better query performance
eCommerceHomeCatergoryCartModel.index({ slug: 1 });
eCommerceHomeCatergoryCartModel.index({ pCategory: 1 });
eCommerceHomeCatergoryCartModel.index({ category: 1 });
eCommerceHomeCatergoryCartModel.index({ createdAt: -1 });

module.exports = mongoose.model(
  "E-CommerceHomeCatergoryCartModel",
  eCommerceHomeCatergoryCartModel
);
