const addressModel = require("../../models/ecommerce/addressModel");

// ============= Get Id =========
exports.getAddressId = async (req, res, next, id) => {
    try {
      let address = await addressModel.findById(id);
      if (!address) {
        return res.status(404).json({
          success: false,
          message: "address Not Found",
        });
      } else {
        (req.Address = address), next();
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

// =================== create ==================
exports.create = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      customerId,
      city,
      mobile,
      address,
      area,
      apartment,
      landmark,
      pinCode,
      latitude,
      longitude,
      state,
      country,
      addressType
    } = req.body;
    if (!firstName) {
      return res
        .status(400)
        .send({ success: false, message: "firstName required" });
    }
    if (!lastName) {
      return res
        .status(400)
        .send({ success: false, message: "lastName required" });
    }
    if (!customerId) {
      return res
        .status(400)
        .send({ success: false, message: "customerId required" });
    }
    if (!mobile) {
      return res
        .status(400)
        .send({ success: false, message: "mobile required" });
    }
    if (!landmark) {
      return res
        .status(400)
        .send({ success: false, message: "landmark required" });
    }
    if (!address) {
      return res
        .status(400)
        .send({ success: false, message: "address required" });
    }
    if (!area) {
      return res.status(400).send({ success: false, message: "area required" });
    }
    if (!city) {
      return res.status(400).send({ success: false, message: "city required" });
    }
    if (!latitude) {
      return res.status(400).send({ success: false, message: "latitude required" });
    }
    if (!longitude) {
      return res.status(400).send({ success: false, message: "longitude required" });
    }
    if (!pinCode) {
      return res.status(400).send({ success: false, message: "pinCode required" });
    }
    if(!state){
      return res.status(400).send({ success: false, message: "state required" });
    }
    if(!country){
      return res.status(400).send({ success: false, message: "country required" });
    }
    const createAdd = await addressModel.create({
      firstName: firstName,
      lastName: lastName,
      mobile: mobile,
      customerId: customerId,
      apartment: apartment,
      landmark: landmark,
      address: address,
      area: area,
      city: city,
      pinCode:pinCode,
      latitude:latitude,
      longitude:longitude,
      state:state,
      country:country,
      addressType:addressType,
    });
    return res.status(201).send({
      success: true,
      message: "Address Created Successfully",
      data: createAdd,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ============== Get All Customer Address ==================
exports.getAllByCustomerId = async (req, res) => {
  try {
    let data = await addressModel.find({ customerId: req.User._id }).sort({createdAt : -1});
    return res.status(200).send({
      success: true,
      message: "Address Not Fetch",
      data: data,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// =============== Get =================
exports.getById = async (req, res) => {
  try {
    return res.status(200).send({
      success: true,
      message: "Address Fetch Successfully",
      data: req.Address,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// =================== update ====================
exports.updateAddress = async (req, res) => {
  try {
    let {
      firstName,
      lastName,
      customerId,
      city,
      mobile,
      address,
      area,
      apartment,
      landmark,
      pinCode,
      latitude,
      longitude,
      state,
      country,
      addressType
    } = req.body;

    let updateData = await addressModel.findOneAndUpdate(
      { _id: req.Address._id },
      {
        $set: {
          firstName: firstName,
          lastName: lastName,
          mobile: mobile,
          customerId: customerId,
          apartment: apartment,
          landmark: landmark,
          address: address,
          area: area,
          city: city,
          pinCode:pinCode,
          latitude:latitude,
          longitude:longitude,
          state:state,
          country:country,
          addressType:addressType
        },
      },
      {
        new: true,
      }
    );
    return res.status(200).send({
      success: true,
      message: "Address update succesfully",
      data: updateData,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// =================== delete ====================
exports.deleteAddress = async (req, res) => {
  try {
    let data = await addressModel.findOneAndDelete({ _id: req.Address._id });
    return res.status(200).send({
      success: true,
      message: "Address Deleted Successfully",
      data: data,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};
