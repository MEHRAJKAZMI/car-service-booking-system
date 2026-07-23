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

    // Generate a short-lived access token (used for regular API requests)
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Generate a longer-lived refresh token (used only to get a new access token later)
    // Note: we use a SEPARATE secret for refresh tokens - this way, even if the access
    // token secret is ever compromised, refresh tokens signed with a different secret stay safe
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Save the refresh token to the database so we can verify/revoke it later
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
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

// Takes a valid refresh token and issues a new access token
// This does NOT require the "protect" middleware since the access token has already expired
// Instead, we verify the refresh token directly here
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token is required' });
    }

    // Verify the refresh token's signature and expiry using its OWN secret
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find the user and check the refresh token matches what we stored in the database
    // This is the key security check: even if the token is technically valid,
    // if it doesn't match what's stored (e.g., user already logged out, or this
    // exact token was already replaced by a newer one), we reject it
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Everything checks out - issue a brand new access token
    const newAccessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({
      message: 'Access token refreshed successfully',
      accessToken: newAccessToken
    });

  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// Get the logged-in user's profile
// This route is protected - it only runs AFTER our "protect" middleware confirms the token is valid
const getProfile = async (req, res) => {
  try {
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
// Change password - protected route, requires current password to confirm identity
// Even though the user is already authenticated via token, changing password
// requires re-proving identity since it's a highly sensitive action
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Fetch the full user document (we need the password field to compare)
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the current password matches what's stored
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Set the new password - our pre('save') hook will automatically hash it
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Logout - since JWTs are stateless, the server doesn't track sessions
// "Logging out" simply means the client deletes/stops sending the token
const logout = async (req, res) => {
  try {
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = { register, login, refreshAccessToken, getProfile, updateProfile, changePassword, logout };