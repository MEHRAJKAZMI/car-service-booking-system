const Booking = require('../models/Booking');
const Shop = require('../models/Shop');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Create a booking - the core customer-facing action
const createBooking = async (req, res) => {
  try {
    const { shop, serviceIds, vehicle, bookingType, address, scheduledAt, notes } = req.body;

    // Conditional validation: roadside bookings MUST have an address
    if (bookingType === 'roadside' && (!address || address.trim() === '')) {
      return sendError(res, 400, 'Address is required for roadside bookings');
    }

    // Fetch the shop so we can validate the selected services actually belong to it,
    // and snapshot their current name/price into the booking
    const shopDoc = await Shop.findById(shop);
    if (!shopDoc) {
      return sendError(res, 404, 'Shop not found');
    }

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return sendError(res, 400, 'At least one service must be selected');
    }

    // Build the services array by looking up each selected service inside the shop's embedded list
    const selectedServices = [];
    for (const serviceId of serviceIds) {
      const service = shopDoc.services.id(serviceId);
      if (!service) {
        return sendError(res, 400, `Service with id ${serviceId} not found on this shop`);
      }
      selectedServices.push({
        serviceId: service._id,
        name: service.name,
        price: service.price
      });
    }

    const booking = await Booking.create({
      customer: req.user.userId,
      shop,
      services: selectedServices,
      vehicle,
      bookingType,
      address: bookingType === 'roadside' ? address : '',
      scheduledAt,
      notes
    });

    return sendSuccess(res, 201, 'Booking created successfully', { booking });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Get all bookings belonging to the logged-in customer
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user.userId })
      .populate('shop', 'shopName phoneNumber city')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Bookings fetched successfully', { bookings });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Get ALL bookings across all customers - admin/shop-management view
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('shop', 'shopName phoneNumber city')
      .populate('customer', 'firstName lastName email phoneNumber')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Bookings fetched successfully', { bookings });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Get a single booking's details
const getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('shop', 'shopName phoneNumber city completeAddress')
      .populate('customer', 'firstName lastName email phoneNumber');

    if (!booking) {
      return sendError(res, 404, 'Booking not found');
    }

    return sendSuccess(res, 200, 'Booking fetched successfully', { booking });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Update booking status - generic status changer for shop/admin use
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 400, 'Invalid status value');
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return sendError(res, 404, 'Booking not found');
    }

    return sendSuccess(res, 200, 'Booking status updated successfully', { booking });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Cancel a booking - customer-facing action, requires an optional reason
const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', cancellationReason: reason || '' },
      { new: true }
    );

    if (!booking) {
      return sendError(res, 404, 'Booking not found');
    }

    return sendSuccess(res, 200, 'Booking cancelled successfully', { booking });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingDetails,
  updateBookingStatus,
  cancelBooking
};