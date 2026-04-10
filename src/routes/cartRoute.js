const controller = require("../controllers/cartController");

const express = require("express");
const router = express.Router();
const { dummyBillDetail } = require("../midellwares/billDetail");
const { upload, imageValidetion } = require("../midellwares/multerMidellware");
const Midellwares = require("../midellwares/userMidellware");

router.param("customerId", Midellwares.getUserId);
router.param("CartId", controller.getCartId);

// ================== Post ==================
router.post(
  "/createCart",
  upload.single("image"),
  imageValidetion,
  controller.createCartByAdmin
);
router.post("/createDummyCart", controller.createDummyCart);
// ================== Get ==================
router.get(
  "/getAllCartBycustomerId/:customerId",
  dummyBillDetail,
  controller.getAllCartBycustomerId
);

// ================== Put ==================
router.put("/quantityUpdate/:CartId", controller.quantityUpdate);
router.put("/removeQuantity/:CartId", controller.removeQuantity);
router.put(
  "/updateImage/:CartId",
  upload.single("image"),
  imageValidetion,
  controller.updateImage
);

// ================== Delete ==================
router.delete("/deleteCustomerCart/:customerId", controller.deleteCustomerCart);
router.delete("/deleteCartById/:CartId", controller.deleteCartById);

router.get(
  "/getAllCartByuserId/:userId",
  dummyBillDetail,
  controller.getAllCartBycustomerId
);
// ============Admin
router.post(
  "/createCartByAdmin",
  upload.single("image"),
  imageValidetion,
  controller.createCartByAdmin
);
module.exports = router;
