const controller = require("../../controllers/ecommerce/CartController");

const express = require("express");
const router = express.Router();
const {
  billDetailEcommerce,
  dummyBillDetails,
} = require("../../midellwares/billDetail");

const Midellwares = require("../../midellwares/userMidellware");

router.param("customerId", Midellwares.getUserId);

router.param("CartId", controller.getCartId);

// ================== Post ==================
router.post("/eCommerce/createCart", controller.createCart); //done

router.post("/eCommerce/createDummyCart", controller.createDummyCart);

// ================== Get ==================
router.get("/eCommerce/getCart/:customerId",controller.getCart) // done

router.get(
  "/eCommerce/getAllCartBycustomerId/:customerId", //done
  billDetailEcommerce,
  controller.getAllCartBycustomerId
);

// router.get(
//   "/eCommerce/getAllDummyCartBycustomerId/:userId",
//   dummyBillDetails,
//   controller.getAllCartBycustomerId
// );

// ================== Put ==================
router.put("/eCommerce/quantityUpdate/:customerId/:variantId", controller.quantityUpdate); //done
// router.put("/eCommerce/removeQuantity/:CartId", controller.removeQuantity);

// ================== Delete ==================
router.delete(
  "/eCommerce/removeItemCart/:customerId/:variantId",  //done
  controller.deleteCustomerCart
);
// router.delete("/eCommerce/deleteCartById/:CartId", controller.deleteCartById);

module.exports = router;
