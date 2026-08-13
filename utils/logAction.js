const AuditLog = require('../models/AuditLog');

// Internal helper - NOT an API route. Other controllers call this whenever
// a significant admin action happens (role changed, shop approved, user deleted, etc.)
const logAction = async ({ performedBy, action, module, targetId, details }) => {
  try {
    await AuditLog.create({
      performedBy,
      action,
      module,
      targetId: targetId || null,
      details: details || {}
    });
  } catch (error) {
    // Never let a failed audit log crash the actual action that triggered it
    console.error('Failed to write audit log:', error.message);
  }
};

module.exports = logAction;