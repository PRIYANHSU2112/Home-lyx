const express = require("express");
const router = express.Router();

const { userRoute } = require("../../midellwares/auth");
const {
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  getWishlist,
  isProductInWishlist,
} = require("../../controllers/ecommerce/wishlist.Controller");

// add product to wishlist
router.post("/wishlist/add", userRoute, addToWishlist);

// toggle wishlist
router.post("/wishlist/toggle", userRoute, toggleWishlist);

// get wishlist 
router.get("/wishlist", userRoute, getWishlist);

// check product in wishlist
router.get("/wishlist/:productId", userRoute, isProductInWishlist);

// remove from wishlist
router.delete("/wishlist/:productId", userRoute, removeFromWishlist);



module.exports = router;
