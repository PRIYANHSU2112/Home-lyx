const controller = require("../controllers/cityController");
const express = require("express");
const router = express.Router();
const { adminRoute } = require("../midellwares/auth");
const { isCity } = require("../midellwares/PermissionMidellware");
router.param("cityId", controller.getCityId);
router.param("adminId", adminRoute);


// ================ Get ===========
router.get("/getByCityId/:cityId", controller.getByCityId);
router.get("/getAllCity", controller.getAllCity);

// =============== Admin ============
// ================= Post ================
router.post("/createCity/:adminId", isCity, controller.createCity);

// ============== Get ==============
router.get("/getAllCityByAdmin/:adminId", isCity, controller.getAllCityByAdmin);

// =============== Put ============
router.put("/updateCity/:cityId/:adminId", isCity, controller.updateCity);
router.put("/disableCity/:cityId/:adminId", isCity, controller.disableCity);

// ============== Delete ============
router.delete("/deleteCity/:cityId/:adminId", isCity, controller.deleteCity);

module.exports = router;
