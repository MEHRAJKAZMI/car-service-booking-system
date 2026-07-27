const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, role, status } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 400, 'Email is already registered');
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      role,
      status
    });

    return sendSuccess(res, 201, 'User created successfully', {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('role');

    return sendSuccess(res, 200, 'Users fetched successfully', { users });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('role');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'User fetched successfully', { user });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, role, status } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, phoneNumber, role, status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'User updated successfully', { user });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'User deleted successfully');

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    ).select('-password');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'User activated successfully', { user });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    ).select('-password');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'User deactivated successfully', { user });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser
};