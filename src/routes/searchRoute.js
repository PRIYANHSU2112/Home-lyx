const controller = require("../controllers/searchController");
const express = require("express");
const router = express.Router();
// = search
router.get("/searchServices",controller.searchServices)

router.get("/globalSearch",controller.globalSearch)


module.exports = router;