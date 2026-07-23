const User = require('../models/User');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, role } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      role
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

const token = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);

res.status(200).json({
  message: 'Login successful',
  token,
  user: {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status
  }
});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Get the logged-in user's profile
// This route is protected - it only runs AFTER our "protect" middleware confirms the token is valid
const getProfile = async (req, res) => {
  try {
    // req.user was attached by our middleware (contains userId and role from the token)
    // We use userId to fetch the full, current user data from the database
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};

// Update the logged-in user's profile
// Protected route - req.user is available because "protect" middleware ran first
const updateProfile = async (req, res) => {
  try {
    // Only allow these specific fields to be updated
    // We deliberately do NOT allow email, password, or role to be changed here
    // (email changes need extra verification, password has its own dedicated route,
    // and role changes should only be done by an authorized admin, not by the user themselves)
    const { firstName, lastName, phoneNumber } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { firstName, lastName, phoneNumber },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Logout - since JWTs are stateless, the server doesn't track sessions
// "Logging out" simply means the client deletes/stops sending the token
// This endpoint exists mainly for a consistent API contract and to confirm the action
const logout = async (req, res) => {
  try {
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = { register, login, getProfile, updateProfile, logout };