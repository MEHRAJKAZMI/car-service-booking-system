const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Get all audit logs, with optional filters via query params:
// ?performedBy=<userId>&module=<moduleName>&startDate=&endDate=
const getAllLogs = async (req, res) => {
  try {
    const { performedBy, module, startDate, endDate } = req.query;

    const filter = {};
    if (performedBy) filter.performedBy = performedBy;
    if (module) filter.module = module;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Audit logs fetched successfully', { logs });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// Get a single audit log's details
const getLogDetails = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('performedBy', 'firstName lastName email');

    if (!log) {
      return sendError(res, 404, 'Audit log not found');
    }

    return sendSuccess(res, 200, 'Audit log fetched successfully', { log });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = { getAllLogs, getLogDetails };