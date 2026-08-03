const Service = require('../models/Service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Create a service under a specific shop
const createService = async (req, res) => {
  try {
    const { shop, name, description, price, durationMinutes, status } = req.body;

    const service = await Service.create({
      shop,
      name,
      description,
      price,
      durationMinutes,
      status
    });

    return sendSuccess(res, 201, 'Service created successfully', { service });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Get all services - optionally filter by shop using ?shop=<shopId> query param
const getAllServices = async (req, res) => {
  try {
    const filter = {};
    if (req.query.shop) {
      filter.shop = req.query.shop;
    }

    const services = await Service.find(filter).populate('shop', 'shopName');

    return sendSuccess(res, 200, 'Services fetched successfully', { services });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Get a single service's details
const getServiceDetails = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('shop', 'shopName');

    if (!service) {
      return sendError(res, 404, 'Service not found');
    }

    return sendSuccess(res, 200, 'Service fetched successfully', { service });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Update a service
const updateService = async (req, res) => {
  try {
    const { name, description, price, durationMinutes, status } = req.body;

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { name, description, price, durationMinutes, status },
      { new: true, runValidators: true }
    );

    if (!service) {
      return sendError(res, 404, 'Service not found');
    }

    return sendSuccess(res, 200, 'Service updated successfully', { service });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Delete a service
const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      return sendError(res, 404, 'Service not found');
    }

    return sendSuccess(res, 200, 'Service deleted successfully');

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  createService,
  getAllServices,
  getServiceDetails,
  updateService,
  deleteService
};