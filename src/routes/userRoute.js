const express = require("express");
const router = express.Router();
const controller = require("../controllers/userController");
const Midellwares = require("../midellwares/userMidellware");
const { adminRoute } = require("../midellwares/auth");
const { upload,imageValidetion } = require("../midellwares/multerMidellware");
const { isUser } = require("../midellwares/PermissionMidellware");
// ================== Midellwares ================== ||
router.param("userId", Midellwares.getUserId);
router.param("adminId", adminRoute);

// ============= Post =============
// router.post("/register", controller.register); //done
// router.post("/login", Midellwares.getUserCustomer, controller.login); //done
// router.post("/login/partner", Midellwares.getUserPartner, controller.login);
router.post("/login", controller.login); //done

router.post("/sendOtp", controller.sendOtp);//done
router.post("/logOut", controller.logOut);//done


// =============== Put ==========
router.put(             
  "/updateUser/:userId",    // done
  upload.single("image"),
  imageValidetion,
  controller.updateUser
);

// =============== get ===========
router.get("/getUserById/:userId", controller.getUserById);   // done

// =============== admin =========

// ==================== post ===================
router.post("/adminLogin", controller.adminLogin);//done
router.post("/craeteAdminAndSubAdmin", controller.craeteAdminAndSubAdmin);//  done

// ======================= get =====================
router.get(
  "/getUserByPhoneNumber/:adminId",    //done
  isUser,
  controller.getUserByPhoneNumber
);
router.get("/getAllUser/:adminId", isUser, controller.getAllUser); //done
router.get("/getUserBYToken", controller.getUserBYToken);

// ========================== Put =======================
// router.put("/disableUser/:userId", controller.disableUser);

router.put("/disableUser/:userId/:adminId", isUser, controller.disableUser);  //done

// route for partner
router.post("/partnerLogin", controller.partnerLogin);//done
router.post("/partnerVerify", controller.partnerVerify);//done


module.exports = router;
