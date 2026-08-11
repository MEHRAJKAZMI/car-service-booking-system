const Shop = require('../models/Shop');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Register a new shop - now accepts a "services" array directly in the body.
// Since this comes through multipart/form-data (because of file uploads),
// the services array arrives as a JSON STRING and needs to be parsed.
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
      postalCode,
      services
    } = req.body;

    const ownerCnic = req.files?.ownerCnic ? req.files.ownerCnic[0].path : null;
    const shopLogo = req.files?.shopLogo ? req.files.shopLogo[0].path : null;
    const businessRegistrationCertificate = req.files?.businessRegistrationCertificate
      ? req.files.businessRegistrationCertificate[0].path
      : null;

    // In form-data, arrays/objects are sent as plain text, so "services" arrives
    // as a JSON string like '[{"name":"Oil Change","price":2500,...}]' - parse it back into a real array.
    // If it's already an array (e.g. request sent as raw JSON instead of form-data), use it as-is.
    let parsedServices = [];
    if (services) {
      parsedServices = typeof services === 'string' ? JSON.parse(services) : services;
    }

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
      services: parsedServices,
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

// Add a single service to an existing shop
const addServiceToShop = async (req, res) => {
  try {
    const { name, description, price, durationMinutes, status } = req.body;

    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return sendError(res, 404, 'Shop not found');
    }

    shop.services.push({ name, description, price, durationMinutes, status });
    await shop.save();

    return sendSuccess(res, 201, 'Service added to shop successfully', { shop });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Update a specific embedded service within a shop
const updateShopService = async (req, res) => {
  try {
    const { name, description, price, durationMinutes, status } = req.body;

    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return sendError(res, 404, 'Shop not found');
    }

    // .id() is a Mongoose subdocument helper - finds a subdocument by its _id
    const service = shop.services.id(req.params.serviceId);

    if (!service) {
      return sendError(res, 404, 'Service not found on this shop');
    }

    if (name !== undefined) service.name = name;
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = price;
    if (durationMinutes !== undefined) service.durationMinutes = durationMinutes;
    if (status !== undefined) service.status = status;

    await shop.save();

    return sendSuccess(res, 200, 'Shop service updated successfully', { shop });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Remove a specific embedded service from a shop
const removeShopService = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return sendError(res, 404, 'Shop not found');
    }

    const service = shop.services.id(req.params.serviceId);

    if (!service) {
      return sendError(res, 404, 'Service not found on this shop');
    }

    // .deleteOne() on a subdocument removes it from the parent array
    service.deleteOne();
    await shop.save();

    return sendSuccess(res, 200, 'Service removed from shop successfully', { shop });

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
  changeShopStatus,
  addServiceToShop,
  updateShopService,
  removeShopService
};