const Role = require('../models/Role');

// Dynamic Authorization Middleware
// Usage: authorize('Permission Name') - place this AFTER "protect" on any route
// Flow: User -> Role -> Permissions -> API Access
//
// This is a "middleware factory" - a function that RETURNS a middleware function.
// We do this because we need to pass in which permission name this specific route requires.
const authorize = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // req.user was attached by "protect" middleware, which ran before this one
      // req.user.role is the Role's ObjectId (from the JWT payload)
      const role = await Role.findById(req.user.role).populate('permissions');

      if (!role) {
        return res.status(403).json({ message: 'Role not found, access denied' });
      }

      if (role.status !== 'active') {
        return res.status(403).json({ message: 'Role is inactive, access denied' });
      }

      // Check if this role has the special "ALL" permission
      // If so, skip individual permission checks entirely - full access granted
      const hasAllPermission = role.permissions.some((perm) => perm.name === 'ALL');

      if (hasAllPermission) {
        return next();
      }

      // Otherwise, check if the role has the SPECIFIC permission this route requires
      const hasRequiredPermission = role.permissions.some((perm) => perm.name === requiredPermission);

      if (!hasRequiredPermission) {
        return res.status(403).json({
          message: `Access denied - missing required permission: ${requiredPermission}`
        });
      }

      // Permission check passed - proceed to the actual controller
      next();

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

module.exports = { authorize };