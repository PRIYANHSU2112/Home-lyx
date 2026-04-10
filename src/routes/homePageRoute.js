const controller = require("../controllers/homePageController");
const express = require("express");
const { userRoute ,optional} = require("../midellwares/auth");
const router = express.Router();
// =================== get  =====================

router.get("/homePage", controller.getHomeData); //done

router.get("/homePage-getService", controller.getHomeService); //done

router.get("/user-summary", optional, controller.getUserSummary); // done


// router.get("/homePage-getEcommerce", controller.getHomeEcommerce); //done



module.exports = router;
