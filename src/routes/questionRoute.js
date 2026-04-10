const controller = require("../controllers/questionController");
const express = require("express");
const router = express.Router();

router.post("/createQuestion", controller.createQuestion);
router.get("/getAllQuestion", controller.getAllQuestion);
router.get("/getByIdQuestion/:questionId", controller.getByIdQuestion);
router.put("/updateQuestion/:questionId", controller.updateQuestion);
router.put("/disableQuestion/:questionId", controller.disableQuestion);

module.exports = router;
