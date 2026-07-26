const Shop = require('../models/Shop');

// Register a new shop - can be called by a Shop Owner (for themselves) or an Admin (with permission)
// Uses Multer, so req.files contains uploaded files, req.body contains text fields
const registerShop = async (req, res) => {
  try {
    const {
      shopName,
      ownerName,
      email,
      phoneNumber,
      businessType,
      ntnNumber,
      taxRegistrationNumber,
      country,
      province,
      city,
      completeAddress,
      postalCode
    } = req.body;

    // req.files is populated by Multer when using upload.fields([...])
    // Each field name maps to an array of uploaded file objects
    const ownerCnic = req.files?.ownerCnic ? req.files.ownerCnic[0].path : null;
    const shopLogo = req.files?.shopLogo ? req.files.shopLogo[0].path : null;
    const businessRegistrationCertificate = req.files?.businessRegistrationCertificate
      ? req.files.businessRegistrationCertificate[0].path
      : null;

    const shop = await Shop.create({
      shopName,
      ownerName,
      email,
      phoneNumber,
      businessType,
      ntnNumber,
      taxRegistrationNumber,
      country,
      province,
      city,
      completeAddress,
      postalCode,
      ownerCnic,
      shopLogo,
      businessRegistrationCertificate,
      // req.user comes from the "protect" middleware - whoever is logged in and submitting this
      registeredBy: req.user.userId
    });

    res.status(201).json({
      message: 'Shop registered successfully',
      shop
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all shops
const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find().populate('registeredBy', 'firstName lastName email');

    res.status(200).json({ shops });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single shop's details
const getShopDetails = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('registeredBy', 'firstName lastName email');

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    res.status(200).json({ shop });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update shop details (text fields only - file re-upload handled separately if needed)
const updateShop = async (req, res) => {
  try {
    const {
      shopName,
      ownerName,
      email,
      phoneNumber,
      businessType,
      ntnNumber,
      taxRegistrationNumber,
      country,
      province,
      city,
      completeAddress,
      postalCode
    } = req.body;

    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      {
        shopName,
        ownerName,
        email,
        phoneNumber,
        businessType,
        ntnNumber,
        taxRegistrationNumber,
        country,
        province,
        city,
        completeAddress,
        postalCode
      },
      { new: true, runValidators: true }
    );

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    res.status(200).json({
      message: 'Shop updated successfully',
      shop
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a shop
const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.id);

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    res.status(200).json({ message: 'Shop deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve a shop
const approveShop = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', rejectionReason: '' },
      { new: true }
    );

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    res.status(200).json({
      message: 'Shop approved successfully',
      shop
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject a shop - expects an optional "reason" in the body
const rejectShop = async (req, res) => {
  try {
    const { reason } = req.body;

    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason || '' },
      { new: true }
    );

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    res.status(200).json({
      message: 'Shop rejected successfully',
      shop
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generic status change - lets an admin move a shop to any valid status
// (e.g. moving from "pending" to "under_review" before a final approve/reject decision)
const changeShopStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'under_review', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    res.status(200).json({
      message: 'Shop status updated successfully',
      shop
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerShop,
  getAllShops,
  getShopDetails,
  updateShop,
  deleteShop,
  approveShop,
  rejectShop,
  changeShopStatus
};