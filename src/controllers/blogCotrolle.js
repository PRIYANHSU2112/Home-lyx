const blogModel = require("../models/blogModel");
const { deleteFileFromObjectStorage } = require("../midellwares/multerMidellware");
const { generateTransactionId } = require("../helper/slugGenreted");

exports.createBlog = async(req,res)=>{
  
     try {
     const { title, description, metaTitle, metaDescription, metaKeywords} = req.body;

     const slug = await generateTransactionId("blog", title?.toString()?.toLocaleLowerCase());
     const image = req.file?.location || null;

     

    let meta = { 
	title: metaTitle, 
	description: metaDescription,    
	keywords: metaKeywords, 
	};
     const blog = await blogModel.create({ title, description,meta, image,slug:slug });

    res.status(201).json({
    success: true,
    message: "Blog created successfully",
    data:blog,
  });
  
    } catch (error) {
        res.status(500).json({success:false,error:error.message});
    }
    
};




exports.updateBlog = async(req,res)=>{
  
    try {
   
    const {blogId, title, description, metaTitle, metaDescription, metaKeywords } = req.body;
    const image = req.file?.location; 

    const blog = await blogModel.findById(blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog are not found",
      });
    }

    if(image&&blog.image){
        await deleteFileFromObjectStorage(blog.image)
    }


    if (title) blog.title = title;
    if (description) blog.description = description;
    if (image) blog.image = image;
    blog.meta = {
      title: metaTitle,
      description: metaDescription,
      keywords: metaKeywords,
    };

     const slug = await generateTransactionId("blog", title?.toString()?.toLocaleLowerCase());
     blog.slug = slug;
    const updatedBlog = await blog.save();

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
    
};

exports.getBlogById = async(req,res)=>{

    try {
    const { blogId,slug } = req.query;
     

    if (!blogId && !slug ) {
      return res.status(400).json({
        success: false,
        message: "blogId or slug is required",
      });
    }

   let blog;

    if (slug) {
      blog = await blogModel.findOne({ slug });
    } else if (blogId) {
      blog = await blogModel.findById(blogId);
    }

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Blog fetched successfully",
      data: blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

exports.deleteBlog = async(req,res)=>{

    try {
        const {blogId} = req.query;

        if (!blogId) {
      return res.status(400).json({
        success: false,
        message: "blogId is required",
      });
    }
    
    const removeData = await blogModel.findByIdAndDelete(blogId);

    res.status(200).json({success:true, message:"Blog delete successfully",data:removeData})

    } catch (error) {
       res.status(500).json({
      success: false,
      error: error.message,
    }); 
    }
};

exports.getBlog = async(req,res)=>{

     try {
       const blogData = await blogModel.find();

       res.status(200).json({success:true,message:"All blog fetched successfully",data:blogData})

    } catch (error) {

     res.status(500).json({
      success: false,
      error: error.message,

    });
    }

}


