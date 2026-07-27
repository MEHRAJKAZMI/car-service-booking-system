const Role = require('../models/Role');
const Permission = require('../models/Permission');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const createRole = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return sendError(res, 400, 'Role with this name already exists');
    }

    const role = await Role.create({ name, description, status });

    return sendSuccess(res, 201, 'Role created successfully', { role });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().populate('permissions');

    return sendSuccess(res, 200, 'Roles fetched successfully', { roles });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getRoleDetails = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate('permissions');

    if (!role) {
      return sendError(res, 404, 'Role not found');
    }

    return sendSuccess(res, 200, 'Role fetched successfully', { role });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const updateRole = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { name, description, status },
      { new: true, runValidators: true }
    );

    if (!role) {
      return sendError(res, 404, 'Role not found');
    }

    return sendSuccess(res, 200, 'Role updated successfully', { role });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);

    if (!role) {
      return sendError(res, 404, 'Role not found');
    }

    return sendSuccess(res, 200, 'Role deleted successfully');

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const assignPermissionsToRole = async (req, res) => {
  try {
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
      return sendError(res, 400, 'permissionIds must be an array');
    }

    const foundPermissions = await Permission.find({ _id: { $in: permissionIds } });

    if (foundPermissions.length !== permissionIds.length) {
      return sendError(res, 400, 'One or more permission IDs are invalid');
    }

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { permissions: permissionIds },
      { new: true }
    ).populate('permissions');

    if (!role) {
      return sendError(res, 404, 'Role not found');
    }

    return sendSuccess(res, 200, 'Permissions assigned to role successfully', { role });

  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  createRole,
  getRoles,
  getRoleDetails,
  updateRole,
  deleteRole,
  assignPermissionsToRole
};