const controller = require("../controllers/contactUsControler");
const express = require("express");
const router = express.Router();
const { adminRoute, partnerRoute } = require("../midellwares/auth");
router.param("ContactUsId", controller.getContactUsId);
router.param("adminId", adminRoute);



// ================ Get ===========
router.get("/getByContactUsId/:ContactUsId", controller.getByContactUsId); // done


// ================= Post ================
router.post("/createContactUs", controller.createContactUs);   // done 


// =============== Put ============
router.put("/updateContactUs/:ContactUsId", controller.updateContactUs); //--


// =============== Admin ============

// ============== Get ==============
router.get("/getAllContactUs/:adminId", controller.getAllContactUs); // done

// ============== Delete ============
router.delete("/deleteContactUs/:ContactUsId/:adminId", controller.deleteContactUs); // done

// =============== Partner ============
router.post("/partner/createContactUs", partnerRoute, controller.partnerCreateContactUs);

module.exports = router;

