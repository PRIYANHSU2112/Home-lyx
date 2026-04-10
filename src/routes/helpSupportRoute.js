const express = require("express");
const router = express.Router();

const { userRoute } = require("../midellwares/auth");

const {
  createHelpAndSupport,
  getAllHelpAndSupport,
  getHelpAndSupportById,
  updateHelpAndSupport,
  toggleHelpAndSupportDisable,
  deleteHelpAndSupport,
} = require("../controllers/helpSupportController");

router.post("/help-support/create", userRoute, createHelpAndSupport);


router.get("/help-support", userRoute, getAllHelpAndSupport);

// Get Help & Support by ID
router.get("/help-support/:id", userRoute, getHelpAndSupportById);

// Update Help & Support
router.put("/help-support/update/:id", userRoute, updateHelpAndSupport);

// Toggle Disable / Enable
router.patch(
  "/help-support/toggle-disable/:id",
  userRoute,
  toggleHelpAndSupportDisable
);

// Delete Help & Support
router.delete("/help-support/delete/:id", userRoute, deleteHelpAndSupport);

module.exports = router;


