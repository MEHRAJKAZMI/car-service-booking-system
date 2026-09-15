const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'No token provided, access denied');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('_id role status');
    if (!user || user.status !== 'active') {
      return sendError(res, 401, 'User account is inactive or no longer exists');
    }
    req.user = { userId: user._id.toString(), role: user.role.toString() };

    next();

  } catch (error) {
    return sendError(res, 401, 'Invalid or expired token');
  }
};

module.exports = { protect };
