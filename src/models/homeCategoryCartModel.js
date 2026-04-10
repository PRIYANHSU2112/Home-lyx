const mongoose = require("mongoose");
let objectId = mongoose.Types.ObjectId;

const homeCatergoryCartModel = mongoose.Schema(
  {
    title: String,
    subtitle: String,
    image: String,
    pCategory: { type: objectId, ref: "categoryModel"},
    category: { type: objectId, ref: "categoryModel"},
    backgroundColourCode: String,
    taskColourCode: String,
    slug:{
      type:String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "homeCatergoryCartModel",
  homeCatergoryCartModel
);
