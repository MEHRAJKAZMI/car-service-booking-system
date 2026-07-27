const Permission = require('../models/Permission');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const createPermission = async (req, res) => {
  try {
    const { name, module, description } = req.body;

    const existingPermission = await Permission.findOne({ name });
    if (existingPermission) {
      return sendError(res, 400, 'Permission with this name already exists');
    }

    const permission = await Permission.create({ name, module, description });

    return sendSuccess(res, 201, 'Permission created successfully', { permission });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find();

    return sendSuccess(res, 200, 'Permissions fetched successfully', { permissions });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getPermissionDetails = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return sendError(res, 404, 'Permission not found');
    }

    return sendSuccess(res, 200, 'Permission fetched successfully', { permission });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const updatePermission = async (req, res) => {
  try {
    const { name, module, description } = req.body;

    const permission = await Permission.findByIdAndUpdate(
      req.params.id,
      { name, module, description },
      { new: true, runValidators: true }
    );

    if (!permission) {
      return sendError(res, 404, 'Permission not found');
    }

    return sendSuccess(res, 200, 'Permission updated successfully', { permission });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findByIdAndDelete(req.params.id);

    if (!permission) {
      return sendError(res, 404, 'Permission not found');
    }

    return sendSuccess(res, 200, 'Permission deleted successfully');

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  createPermission,
  getPermissions,
  getPermissionDetails,
  updatePermission,
  deletePermission
};