const mongoose = require('mongoose');

// Permission schema - represents a single granular permission, e.g. "Create User", "View Shops"
const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // Which module/feature this permission belongs to, e.g. "User Management", "Shop Management"
  module: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;