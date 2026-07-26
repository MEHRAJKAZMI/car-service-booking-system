const Permission = require('../models/Permission');

// Create a new permission
const createPermission = async (req, res) => {
  try {
    const { name, module, description } = req.body;

    const existingPermission = await Permission.findOne({ name });
    if (existingPermission) {
      return res.status(400).json({ message: 'Permission with this name already exists' });
    }

    const permission = await Permission.create({ name, module, description });

    res.status(201).json({
      message: 'Permission created successfully',
      permission
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all permissions
const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find();

    res.status(200).json({ permissions });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single permission by ID
const getPermissionDetails = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    res.status(200).json({ permission });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a permission
const updatePermission = async (req, res) => {
  try {
    const { name, module, description } = req.body;

    const permission = await Permission.findByIdAndUpdate(
      req.params.id,
      { name, module, description },
      { new: true, runValidators: true }
    );

    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    res.status(200).json({
      message: 'Permission updated successfully',
      permission
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a permission
const deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findByIdAndDelete(req.params.id);

    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    res.status(200).json({ message: 'Permission deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPermission,
  getPermissions,
  getPermissionDetails,
  updatePermission,
  deletePermission
};