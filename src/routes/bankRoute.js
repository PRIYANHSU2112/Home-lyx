const express = require("express");
const router = express.Router();

const controller = require("../controllers/bankController");
const {userRoute} = require("../midellwares/auth")

router.post("/add-bank", userRoute, controller.createBank);
router.get("/my-banks", userRoute, controller.getAllMyBanks);
router.put("/update-bank", userRoute, controller.updateBank);
router.delete("/delete-bank/:bankId", userRoute, controller.deleteBank);
router.get("/bank/:bankId", userRoute, controller.getBankById);


module.exports = router;