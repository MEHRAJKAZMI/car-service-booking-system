const User = require('../models/User');

// Create a new user (admin creating a user, e.g. staff member)
// Similar to Register, but done by an authorized admin instead of self-signup
const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, role, status } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
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

    res.status(201).json({
      message: 'User created successfully',
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
    res.status(500).json({ message: error.message });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    // populate('role') replaces the role ObjectId with the full Role document
    const users = await User.find().select('-password -refreshToken -otp -otpExpiry').populate('role');

    res.status(200).json({ users });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single user's details
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken -otp -otpExpiry').populate('role');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a user's details (admin updating another user)
const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, role, status } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, phoneNumber, role, status },
      { new: true, runValidators: true }
    ).select('-password -refreshToken -otp -otpExpiry');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Activate a user (set status to active)
const activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    ).select('-password -refreshToken -otp -otpExpiry');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User activated successfully',
      user
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deactivate a user (set status to inactive)
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    ).select('-password -refreshToken -otp -otpExpiry');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User deactivated successfully',
      user
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
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