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
// Change password - protected route, requires current password to confirm identity
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Step 1 of password reset flow: generate and "send" an OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ message: 'If this email is registered, an OTP has been sent' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    res.status(200).json({
      message: 'OTP generated successfully (for development only - would normally be emailed)',
      otp
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Step 2 of password reset flow: verify the OTP and issue a short-lived reset token
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or OTP' });
    }

    // Check the OTP matches AND hasn't expired
    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // OTP is correct - clear it immediately so it can't be reused
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Issue a short-lived reset token - this is what Reset Password will require
    // Using a dedicated purpose field ("passwordReset") so this token can't be
    // mistaken for or misused as a regular access token
    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'passwordReset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.status(200).json({
      message: 'OTP verified successfully',
      resetToken
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Step 3 of password reset flow: set the new password using the reset token
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    // Verify the reset token using the same JWT_SECRET (it's still a normal JWT, just with a special "purpose")
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    // Crucial check: make sure this token was actually issued for password reset,
    // not some other kind of token that happens to be signed with the same secret
    if (decoded.purpose !== 'passwordReset') {
      return res.status(401).json({ message: 'Invalid reset token' });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set the new password - pre('save') hook hashes it automatically
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });

  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired reset token' });
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


module.exports = { register, login, refreshAccessToken, getProfile, updateProfile, changePassword, forgotPassword, verifyOtp, resetPassword, logout };