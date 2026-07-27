const Role = require('../models/Role');
const { sendError } = require('../utils/apiResponse');

const authorize = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const role = await Role.findById(req.user.role).populate('permissions');

      if (!role) {
        return sendError(res, 403, 'Role not found, access denied');
      }

      if (role.status !== 'active') {
        return sendError(res, 403, 'Role is inactive, access denied');
      }

      const hasAllPermission = role.permissions.some((perm) => perm.name === 'ALL');

      if (hasAllPermission) {
        return next();
      }

      const hasRequiredPermission = role.permissions.some((perm) => perm.name === requiredPermission);

      if (!hasRequiredPermission) {
        return sendError(res, 403, `Access denied - missing required permission: ${requiredPermission}`);
      }

      next();

    } catch (error) {
      return sendError(res, 500, error.message);
    }
  };
};

module.exports = { authorize };