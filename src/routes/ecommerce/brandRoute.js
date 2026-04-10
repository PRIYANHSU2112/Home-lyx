const controller = require("../../controllers/ecommerce/brandController");
const express = require("express");
const router = express.Router();
const { adminRoute } = require("../../midellwares/auth");
const { upload,imageValidetion } = require("../../midellwares/multerMidellware");
const { isBrand } = require("../../midellwares/PermissionMidellware");

router.param("brandId", controller.getbrandId);
router.param("adminId", adminRoute);

// ================ Get ===========
router.get("/getByBrandId/:brandId", controller.getByBrandId);    //done
router.get("/getAllBrand/:categoryId", controller.getAllBrand);    // done
router.get("/getAllBrands", controller.getAllBrands);    // done

// =============== Admin ============
// ================= Post ================
router.post(
  "/createBrand/:adminId",          // done
  isBrand,
  upload.single("image"),
  imageValidetion,
  controller.createBrand
);

// ============== Get ==============
// router.get(
//   "/getAllBrand", controller.getAllBrand
// )


router.get(
  "/getAllBrandByAdmin/:adminId/:categoryId",     //done
  isBrand,
  controller.getAllBrandByAdmin
);

// =============== Put ============
router.put(
  "/updatebrand/:brandId/:adminId",  // done
  isBrand,
  upload.single("image"),
  imageValidetion,
  controller.updateBrand
);
router.patch("/disablebrand/:brandId/:adminId", isBrand, controller.disablebrand); //done

// ============== Delete ============
router.delete(
  "/deleteBrand/:brandId/:adminId",
  isBrand,
  controller.deleteBrand
);


module.exports = router;
