const { body } = require('express-validator');

// Each export here is an ARRAY of validation rules for one specific endpoint.
// These get placed in the route BEFORE our validateRequest middleware, e.g.:
// router.post('/register', registerValidation, validateRequest, register);

const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').notEmpty().withMessage('Role is required')
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const createRoleValidation = [
  body('name').trim().notEmpty().withMessage('Role name is required'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive')
];

const createPermissionValidation = [
  body('name').trim().notEmpty().withMessage('Permission name is required'),
  body('module').trim().notEmpty().withMessage('Module name is required')
];

const createUserValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').notEmpty().withMessage('Role is required')
];

const registerShopValidation = [
  body('shopName').trim().notEmpty().withMessage('Shop name is required'),
  body('ownerName').trim().notEmpty().withMessage('Owner name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
  body('businessType').trim().notEmpty().withMessage('Business type is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('province').trim().notEmpty().withMessage('Province is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('completeAddress').trim().notEmpty().withMessage('Complete address is required')
];

module.exports = {
  registerValidation,
  loginValidation,
  createRoleValidation,
  createPermissionValidation,
  createUserValidation,
  registerShopValidation
};