const mongoose = require('mongoose');

// Role schema - represents a role like "Admin", "Shop Owner", "Customer", etc.
const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  // This will hold references to Permission documents assigned to this role
  // We'll populate this properly once the Permission model exists
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }]
}, {
  timestamps: true
});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;