const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, role } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return sendError(res, 400, 'Email is already registered');
    }

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      role
    });

    return sendSuccess(res, 201, 'User registered successfully', {
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
    return sendError(res, 500, error.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return sendError(res, 401, 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password');
    }

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    user.refreshToken = refreshToken;
    await user.save();

    return sendSuccess(res, 200, 'Login successful', {
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
    return sendError(res, 500, error.message);
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 401, 'Refresh token is required');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return sendError(res, 401, 'Invalid refresh token');
    }

    const newAccessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return sendSuccess(res, 200, 'Access token refreshed successfully', {
      accessToken: newAccessToken
    });

  } catch (error) {
    return sendError(res, 401, 'Invalid or expired refresh token');
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'Profile fetched successfully', { user });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { firstName, lastName, phoneNumber },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'Profile updated successfully', { user: updatedUser });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return sendError(res, 401, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, 200, 'Password changed successfully');

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return sendSuccess(res, 200, 'If this email is registered, an OTP has been sent');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    return sendSuccess(res, 200, 'OTP generated successfully (for development only - would normally be emailed)', { otp });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return sendError(res, 400, 'Invalid email or OTP');
    }

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return sendError(res, 400, 'Invalid or expired OTP');
    }

    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'passwordReset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return sendSuccess(res, 200, 'OTP verified successfully', { resetToken });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken) {
      return sendError(res, 400, 'Reset token is required');
    }

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    if (decoded.purpose !== 'passwordReset') {
      return sendError(res, 401, 'Invalid reset token');
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, 200, 'Password reset successfully');

  } catch (error) {
    return sendError(res, 401, 'Invalid or expired reset token');
  }
};

const logout = async (req, res) => {
  try {
    return sendSuccess(res, 200, 'Logout successful');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
  logout
};