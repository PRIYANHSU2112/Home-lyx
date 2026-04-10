  const Company = require("../models/commpanyModel");
  const {
    deleteFileFromObjectStorage,
  } = require("../midellwares/multerMidellware");

  // =================== Company Update ====================== ||

  exports.updateCompany = async function (req, res) {
    try {
      console.log(req.files);
      const { banner, header_logo, footer_logo, fav_icon, loader, signatory } =
        req.files || {};
      const {
        site_name,
        footer_description,
        footer_about,
        email,
        phone,
        facebook,
        instagram,
        linkedin,
        twitter,
        youtube,
        whastapp,
        map,
        googleMyBusiness,
        pinterest,
        address,
        refund_Policy,
        shippingAndDelivery,
        description,
        seo_keyword,
        seo_description,
        term_condition,
        about_us,
        privacy_policy,
        return_policy,
        theme_color,
        font_Style,
        header_link,
        footer_link,
        gst,
        playstoreLink,
        phone1,
        productDeliveryFee,
        minDelAmount,
        ONBOARDING_DATA,
        adminCharge,
      } = req.body;

      // Mutable copy for parsing/mapping (avoid reassigning the destructured const)
      let onboardingData = ONBOARDING_DATA;

      const mainCompany = await Company.findOne();
      if (req.files != undefined && loader) {
        await deleteFileFromObjectStorage(mainCompany.loader);
      }
      if (req.files && fav_icon && mainCompany.fav_icon) {
        await deleteFileFromObjectStorage(mainCompany.fav_icon);
      }
      if (req.files && signatory && mainCompany.signatory) {
        await deleteFileFromObjectStorage(mainCompany.signatory);
      }
      if (req.files != undefined && banner && mainCompany.banner) {
        await deleteFileFromObjectStorage(mainCompany.banner);
      }
      if (header_logo && mainCompany.header_logo) {
        await deleteFileFromObjectStorage(mainCompany.header_logo);
      }
      if (req.files && footer_logo && mainCompany.footer_logo) {
        await deleteFileFromObjectStorage(mainCompany.footer_logo);
      }
      // Debug logs and robust onboarding image handling
      // console.log("onboardingData before:", onboardingData);
      // console.log("onboarding_files:",
      //   (req.files?.onboarding_images || []).map(
      //     (f) => f.originalname || f.key || f.location
      //   )
      // );

      if (onboardingData && typeof onboardingData === "string") {
        try {
          onboardingData = JSON.parse(onboardingData);
        } catch (err) {
          console.warn("Failed to parse ONBOARDING_DATA:", err.message);
        }
      }

      const onboardingFiles = req.files?.onboarding_images || [];
      if (onboardingFiles.length) {
        if (Array.isArray(onboardingData)) {
          onboardingData = onboardingData.map((item, index) => ({
            ...item,
            image:
              onboardingFiles[index]?.location ||
              onboardingFiles[index]?.key ||
              item.image ||
              null,
          }));
        } else {
          // Create simple onboarding items from files if no ONBOARDING_DATA provided
          onboardingData = onboardingFiles.map((file) => ({
            title: "",
            subtitle: "",
            color: "",
            image: file.location || file.key || null,
          }));
        }
      }

      // console.log("onboardingData after:", onboardingData);
      // console.log("FILES:", req.files);


      if (mainCompany) {
        // Build update object with only provided fields so we don't overwrite existing data
        const updateFields = {};

        // Files
        if (banner) updateFields.banner = banner[0].key;
        if (header_logo) updateFields.header_logo = header_logo[0].key;
        if (footer_logo) updateFields.footer_logo = footer_logo[0].key;
        if (signatory) updateFields.signatory = signatory[0].key;
        if (fav_icon) updateFields.fav_icon = fav_icon[0].key;
        if (loader) updateFields.loader = loader[0].key;

        // Body fields (only add if explicitly provided)
        const bodyFields = {
          site_name,
          footer_description,
          footer_about,
          email,
          phone,
          facebook,
          instagram,
          linkedin,
          twitter,
          youtube,
          whastapp,
          map,
          refund_Policy,
          shippingAndDelivery,
          address,
          description,
          googleMyBusiness,
          pinterest,
          seo_keyword,
          seo_description,
          term_condition,
          privacy_policy,
          return_policy,
          theme_color,
          about_us,
          font_Style,
          header_link,
          footer_link,
          gst,
          playstoreLink,
          phone1,
          productDeliveryFee,
          minDelAmount,
          adminCharge,
        };
        Object.keys(bodyFields).forEach((k) => {
          if (typeof bodyFields[k] !== "undefined") updateFields[k] = bodyFields[k];
        });

        if (Array.isArray(onboardingData)) updateFields.ONBOARDING_DATA = onboardingData;

        Company.findOneAndUpdate({ _id: mainCompany._id }, { $set: updateFields }, { new: true })
          .then((data) => {
            return res.status(200).send({
              success: true,
              message: "successfully updated your data",
              data: data,
            });
          })
          .catch((err) => {
            return res.status(400).send({
              success: false,
              message: err.message,
            });
          });
      } else {
        DataBase.create({ site_name: "company name" });
      }
    } catch (error) {
      return res.status(500).send({ success: false, message: error.message });
    }
  };

  // =================== Company get ====================== ||

  exports.getCompany = async (req, res) => {
    const mainCompany = await Company.findOne();
    if (!mainCompany) {
      return res.status(400).json({
        success: false,
        message: "Company Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      meassage: "Company IS Fatch Successfully...",
      data: mainCompany,
    });
  };

  // =================== Company get ====================== ||

  exports.getCompanyByAdmin = async (req, res) => {
    const mainCompany = await Company.findOne();
    if (!mainCompany) {
      return res.status(400).json({
        success: false,
        message: "Company Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      meassage: "Company IS Fatch Successfully...",
      data: mainCompany,
    });
  };
