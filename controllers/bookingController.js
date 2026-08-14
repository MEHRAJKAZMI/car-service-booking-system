const Booking = require('../models/Booking');
const Shop = require('../models/Shop');
const createNotification = require('../utils/createNotification');
const { checkAllPenalties, checkAllPenaltiesForMany, CUSTOMER_GRACE_MINUTES } = require('../utils/checkBookingPenalty');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const createBooking = async (req, res) => {
  try {
    const { shop, serviceIds, vehicle, bookingType, address, scheduledAt, notes, customerEstimatedArrivalMinutes } = req.body;

    if (bookingType === 'roadside' && (!address || address.trim() === '')) {
      return sendError(res, 400, 'Address is required for roadside bookings');
    }

    const shopDoc = await Shop.findById(shop);
    if (!shopDoc) {
      return sendError(res, 404, 'Shop not found');
    }

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return sendError(res, 400, 'At least one service must be selected');
    }

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

    const bookingData = {
      customer: req.user.userId,
      shop,
      services: selectedServices,
      vehicle,
      bookingType,
      address: bookingType === 'roadside' ? address : '',
      scheduledAt,
      notes
    };

    // Only relevant for shop_visit bookings, and only if the customer actually provided an estimate
    if (bookingType === 'shop_visit' && customerEstimatedArrivalMinutes) {
      const now = new Date();
      bookingData.customerEstimatedArrivalMinutes = customerEstimatedArrivalMinutes;
      bookingData.customerExpectedArrivalTime = new Date(
        now.getTime() + (customerEstimatedArrivalMinutes + CUSTOMER_GRACE_MINUTES) * 60 * 1000
      );
    }

    const booking = await Booking.create(bookingData);

    await createNotification({
      recipient: req.user.userId,
      title: 'Booking Created',
      message: `Your ${bookingType === 'roadside' ? 'roadside' : 'shop visit'} booking at ${shopDoc.shopName} has been created and is pending confirmation.`,
      type: 'booking_created',
      relatedBooking: booking._id
    });

    return sendSuccess(res, 201, 'Booking created successfully', { booking });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getMyBookings = async (req, res) => {
  try {
    let bookings = await Booking.find({ customer: req.user.userId })
      .populate('shop', 'shopName phoneNumber city')
      .sort({ createdAt: -1 });

    bookings = await checkAllPenaltiesForMany(bookings);

    return sendSuccess(res, 200, 'Bookings fetched successfully', { bookings });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getAllBookings = async (req, res) => {
  try {
    let bookings = await Booking.find()
      .populate('shop', 'shopName phoneNumber city')
      .populate('customer', 'firstName lastName email phoneNumber')
      .sort({ createdAt: -1 });

    bookings = await checkAllPenaltiesForMany(bookings);

    return sendSuccess(res, 200, 'Bookings fetched successfully', { bookings });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getBookingDetails = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id)
      .populate('shop', 'shopName phoneNumber city completeAddress')
      .populate('customer', 'firstName lastName email phoneNumber');

    if (!booking) {
      return sendError(res, 404, 'Booking not found');
    }

    booking = await checkAllPenalties(booking);

    return sendSuccess(res, 200, 'Booking fetched successfully', { booking });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

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

    const statusMessages = {
      confirmed: 'Your booking has been confirmed.',
      in_progress: 'Work has started on your booking.',
      completed: 'Your booking has been marked as completed.',
      cancelled: 'Your booking has been cancelled.',
      pending: 'Your booking status was reset to pending.'
    };

    await createNotification({
      recipient: booking.customer,
      title: 'Booking Status Updated',
      message: statusMessages[status] || `Your booking status changed to ${status}.`,
      type: 'booking_status_changed',
      relatedBooking: booking._id
    });

    return sendSuccess(res, 200, 'Booking status updated successfully', { booking });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Shop staff marks the customer as having physically arrived at the shop
const markCustomerArrived = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return sendError(res, 404, 'Booking not found');
    }

    if (booking.bookingType !== 'shop_visit') {
      return sendError(res, 400, 'This action only applies to shop_visit bookings');
    }

    if (booking.customerArrivedAt) {
      return sendError(res, 400, 'Customer arrival has already been recorded for this booking');
    }

    booking.customerArrivedAt = new Date();
    await booking.save();

    return sendSuccess(res, 200, 'Customer arrival recorded successfully', { booking });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

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

    await createNotification({
      recipient: booking.customer,
      title: 'Booking Cancelled',
      message: `Your booking has been cancelled.${reason ? ' Reason: ' + reason : ''}`,
      type: 'booking_cancelled',
      relatedBooking: booking._id
    });

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
  markCustomerArrived,
  cancelBooking
};