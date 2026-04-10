const express = require("express");
const router = express.Router();

const {
  createFeedback,
  getAllFeedbacks,
  getFeedbackById,
  deleteFeedback,
} = require("../controllers/feedBackController");

const {adminRoute ,adminMRoute, userRoute} = require("../midellwares/auth");
router.param("adminId", adminRoute);


// Create feedback
router.post("/createFeedback", userRoute, createFeedback); // done

// Get all feedbacks
router.get("/getAllFeedbacks",adminMRoute, getAllFeedbacks);  // done

// Get feedback by id
router.get("/getFeedbackById/:id",adminMRoute, getFeedbackById); // done

// Delete feedback
router.delete("/deleteFeedback/:id", deleteFeedback); // done

module.exports = router;
