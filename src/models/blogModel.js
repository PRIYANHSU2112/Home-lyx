const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
	  meta: {
      title: { type: String ,default: "Blog"},
      description: { type: String,default: "Blog" },
      keywords: { type: [String],default: ["Blog"] },
    },

  slug: {
    type: String,
    
  },

  },
  {
    timestamps: true,
  }
);

const BlogModel = mongoose.model("Blog", blogSchema);

module.exports = BlogModel;
