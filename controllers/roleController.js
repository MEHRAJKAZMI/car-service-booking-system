const Role = require('../models/Role');
const Permission = require('../models/Permission');

// Create a new role
const createRole = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ message: 'Role with this name already exists' });
    }

    const role = await Role.create({ name, description, status });

    res.status(201).json({
      message: 'Role created successfully',
      role
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all roles
const getRoles = async (req, res) => {
  try {
    // populate('permissions') replaces the stored ObjectIds with the actual Permission documents
    const roles = await Role.find().populate('permissions');

    res.status(200).json({ roles });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single role by ID
const getRoleDetails = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate('permissions');

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(200).json({ role });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a role's basic details (name, description, status)
const updateRole = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { name, description, status },
      { new: true, runValidators: true }
    );

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(200).json({
      message: 'Role updated successfully',
      role
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a role
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(200).json({ message: 'Role deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign one or more permissions to a role
// Body expects: { "permissionIds": ["id1", "id2", ...] }
// This REPLACES the role's current permission list with the new one provided
const assignPermissionsToRole = async (req, res) => {
  try {
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ message: 'permissionIds must be an array' });
    }

    // Verify all provided permission IDs actually exist before assigning
    const foundPermissions = await Permission.find({ _id: { $in: permissionIds } });

    if (foundPermissions.length !== permissionIds.length) {
      return res.status(400).json({ message: 'One or more permission IDs are invalid' });
    }

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { permissions: permissionIds },
      { new: true }
    ).populate('permissions');

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(200).json({
      message: 'Permissions assigned to role successfully',
      role
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
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