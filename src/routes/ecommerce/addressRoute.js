const controller = require("../../controllers/ecommerce/addressController");
const express = require("express");
const router = express.Router();
const {getUserId} = require("../../midellwares/userMidellware");
const {userRoute} = require("../../midellwares/auth");


// =
router.param("AddressId",controller.getAddressId)
router.param("customerId",getUserId)

// ================== Post ===============
router.post("/createAddress", userRoute, controller.create); //done

// =========== Get ============
router.get("/getAllAddressByCustomerId/:customerId",userRoute, controller.getAllByCustomerId); //done
router.get("/getByAddressId/:AddressId",userRoute, controller.getById);     //done

// ============= Put ==============
router.put("/updateAddress/:AddressId",userRoute, controller.updateAddress); //done

// ================ Delete ================
router.delete("/deleteAddress/:AddressId",userRoute, controller.deleteAddress); //done

module.exports = router;
