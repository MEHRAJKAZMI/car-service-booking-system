const Shop = require('../models/Shop');
const { sendSuccess, sendError } = require('../utils/apiResponse');

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
      registeredBy: req.user.userId
    });

    return sendSuccess(res, 201, 'Shop registered successfully', { shop });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find().populate('registeredBy', 'firstName lastName email');

    return sendSuccess(res, 200, 'Shops fetched successfully', { shops });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getShopDetails = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('registeredBy', 'firstName lastName email');

    if (!shop) {
      return sendError(res, 404, 'Shop not found');
    }

    return sendSuccess(res, 200, 'Shop fetched successfully', { shop });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

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
      return sendError(res, 404, 'Shop not found');
    }

    return sendSuccess(res, 200, 'Shop updated successfully', { shop });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.id);

    if (!shop) {
      return sendError(res, 404, 'Shop not found');
    }

    return sendSuccess(res, 200, 'Shop deleted successfully');

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const approveShop = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', rejectionReason: '' },
      { new: true }
    );

    if (!shop) {
      return sendError(res, 404, 'Shop not found');
    }

    return sendSuccess(res, 200, 'Shop approved successfully', { shop });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const rejectShop = async (req, res) => {
  try {
    const { reason } = req.body;

    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason || '' },
      { new: true }
    );

    if (!shop) {
      return sendError(res, 404, 'Shop not found');
    }

    return sendSuccess(res, 200, 'Shop rejected successfully', { shop });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const changeShopStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'under_review', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 400, 'Invalid status value');
    }

    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!shop) {
      return sendError(res, 404, 'Shop not found');
    }

    return sendSuccess(res, 200, 'Shop status updated successfully', { shop });

  } catch (error) {
    return sendError(res, 500, error.message);
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