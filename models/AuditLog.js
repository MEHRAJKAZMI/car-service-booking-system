const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Who performed the action
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // What kind of action - free-form but consistent strings, e.g. "ROLE_UPDATED", "SHOP_APPROVED"
  action: {
    type: String,
    required: true,
    trim: true
  },
  // Which module/resource this action relates to
  module: {
    type: String,
    required: true,
    trim: true
  },
  // The ID of the specific record affected (role id, shop id, user id, etc.)
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  // Freeform details about what changed - kept flexible since different actions log different things
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;