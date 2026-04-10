const controller = require("../controllers/addressController");
const express = require("express");
const router = express.Router();
const {getUserId} = require("../midellwares/userMidellware");

// =
router.param("AddressId",controller.getAddressId)
router.param("customerId",getUserId)

// ================== Post ===============
router.post("/servicesCreateAddress", controller.create);

// =========== Get ============
router.get("/servicesGetAllAddressByCustomerId/:customerId", controller.getAllByCustomerId);
router.get("/servicesGetByAddressId/:AddressId", controller.getById);

// ============= Put ==============
router.put("/servicesUpdateAddress/:AddressId", controller.updateAddress);

// ================ Delete ================
router.delete("/servicesDeleteAddress/:AddressId", controller.deleteAddress);

module.exports = router;