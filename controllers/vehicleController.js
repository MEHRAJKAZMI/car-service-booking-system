const Vehicle = require('../models/Vehicle');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Create a vehicle - always tied to the logged-in user (req.user.userId)
const createVehicle = async (req, res) => {
  try {
    const { make, model, year, plateNumber, color } = req.body;

    const existingVehicle = await Vehicle.findOne({ plateNumber });
    if (existingVehicle) {
      return sendError(res, 400, 'A vehicle with this plate number already exists');
    }

    const vehicle = await Vehicle.create({
      owner: req.user.userId,
      make,
      model,
      year,
      plateNumber,
      color
    });

    return sendSuccess(res, 201, 'Vehicle added successfully', { vehicle });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Get all vehicles belonging to the logged-in user
const getMyVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ owner: req.user.userId });

    return sendSuccess(res, 200, 'Vehicles fetched successfully', { vehicles });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Get a single vehicle's details
const getVehicleDetails = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('owner', 'firstName lastName email');

    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }

    return sendSuccess(res, 200, 'Vehicle fetched successfully', { vehicle });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Update a vehicle
const updateVehicle = async (req, res) => {
  try {
    const { make, model, year, color } = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { make, model, year, color },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }

    return sendSuccess(res, 200, 'Vehicle updated successfully', { vehicle });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Delete a vehicle
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }

    return sendSuccess(res, 200, 'Vehicle deleted successfully');

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  createVehicle,
  getMyVehicles,
  getVehicleDetails,
  updateVehicle,
  deleteVehicle
};