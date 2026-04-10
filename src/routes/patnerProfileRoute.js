const express = require("express");
const controller = require("../controllers/partnerProfileController");
const midellwares = require("../midellwares/multerMidellware");
const router = express.Router();
const { adminRoute } = require("../midellwares/auth");
const {
  profileVerificetionCompleted,
} = require("../midellwares/partnerProfileMidellware");

const {imageDownload} = require("../controllers/partnerProfileController")


router.get("/imageDownload",imageDownload)

// ================== Midellwares ==================//

router.param("PartnerProfileId", controller.getPartnerProfileId);
router.param("adminId", adminRoute);

// ============= Post =============

router.post(
  "/createPartnerProfile",            // done
  midellwares.upload.fields([
    { name: "selfie" },
    { name: "frontImage" },
    { name: "backImage" },
    { name: "documents" },
  ]),
  midellwares.imageValidetion,
  controller.createPartnerProfile
);

// =============== Put ==========

router.put(
  "/updatePartnerProfile/:PartnerProfileId",   // done
  midellwares.upload.fields([
    { name: "selfie" },
    { name: "frontImage" },
    { name: "backImage" },
    { name: "documents" },
  ]),
  midellwares.imageValidetion,
  controller.updatePartnerProfile
);
router.put(
  "/updateDocumentPartnerProfile/:PartnerProfileId",
  midellwares.upload.fields([{ name: "frontImage" }, { name: "backImage" }]),  // done
  controller.updateDocumentPartnerProfile
);
router.put(
  "/updateSelfiePartnerProfile/:PartnerProfileId",     // done
  midellwares.upload.single("selfie"),
  midellwares.imageValidetion,
  controller.updateSelfiePartnerProfile
);

// router.put(
//   "/updateDocumentsPartnerProfile/:PartnerProfileId",
//   midellwares.upload.single("documents"),
//   midellwares.imageValidetion,
//   controller.updateDocumentPartnerProfile
// );

// =============== get ===========
router.get(
  "/getBypartnerProfileId/:PartnerProfileId",        // done
  controller.getBypartnerProfileId
);
router.get(
  "/getBypartnerProfileByUserId/:userId",          // done
  controller.getBypartnerProfileByUserId
);

// ===================== delete =============
router.delete(
  "/deletepartnerProfiler/:PartnerProfileId",   
  controller.deletepartnerProfile
);
router.get("/IdCardGenrate/:userId", controller.IdCardGenrate);  // done

// =============== admin =========
router.get("/getAllpartnerProfile/:adminId", controller.getAllpartnerProfile);   // done
router.get(
  "/getBypartnerProfileId/:PartnerProfileId/:adminId",  // done
  controller.getBypartnerProfileId
);
router.patch(
  "/disablepartnerProfile/:PartnerProfileId/:adminId",  // done
  controller.disablepartnerProfile
);
router.put(
  "/updateDocumentStatus/:PartnerProfileId/:adminId", // done
  profileVerificetionCompleted,
  controller.updateDocumentStatus
);

module.exports = router;
