const Notification = require('../models/Notification');

// Internal helper - NOT an API route. Other controllers (like bookingController)
// call this function directly whenever something notification-worthy happens
// (e.g. booking created, status changed). Keeps notification-creation logic
// in one place instead of repeating it everywhere.
const createNotification = async ({ recipient, title, message, type, relatedBooking }) => {
  try {
    await Notification.create({
      recipient,
      title,
      message,
      type: type || 'general',
      relatedBooking: relatedBooking || null
    });
  } catch (error) {
    // We deliberately do NOT throw here - a failed notification shouldn't
    // ever crash or roll back the actual booking/action that triggered it
    console.error('Failed to create notification:', error.message);
  }
};

module.exports = createNotification;