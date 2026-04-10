

const express = require("express");
const { createBlog, updateBlog, getBlogById, deleteBlog, getBlog } = require("../controllers/blogCotrolle");
const {upload} = require ("../midellwares/multerMidellware")

const router = express.Router();

router.post("/createBlog",
    upload.single("image")
    ,createBlog);                  //done
router.put("/updateBlog",upload.single("image"),updateBlog);   //done

router.get("/getBlogById",getBlogById);  // done
router.delete("/deleteBlog",deleteBlog); //done


router.get("/getBlog",getBlog)  // done



module.exports = router;