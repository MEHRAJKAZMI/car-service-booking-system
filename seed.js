// One-time seed script: creates the "ALL" permission, a "Super Admin" role
// with that permission, and a test admin user assigned to that role.
//
// Run with: node seed.js
// Safe to re-run - it checks for existing records first instead of duplicating them.

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Permission = require('./models/Permission');
const Role = require('./models/Role');
const User = require('./models/User');

const run = async () => {
  try {
    await connectDB();

    // 1. Create the ALL permission (or reuse it if it already exists)
    let allPermission = await Permission.findOne({ name: 'ALL' });
    if (!allPermission) {
      allPermission = await Permission.create({
        name: 'ALL',
        module: 'System',
        description: 'Grants access to every module and every API - bypasses individual permission checks'
      });
      console.log('Created ALL permission:', allPermission._id.toString());
    } else {
      console.log('ALL permission already exists:', allPermission._id.toString());
    }

    // 2. Create the Super Admin role with the ALL permission assigned
    let superAdminRole = await Role.findOne({ name: 'Super Admin' });
    if (!superAdminRole) {
      superAdminRole = await Role.create({
        name: 'Super Admin',
        description: 'Full access to every module and API',
        status: 'active',
        permissions: [allPermission._id]
      });
      console.log('Created Super Admin role:', superAdminRole._id.toString());
    } else {
      console.log('Super Admin role already exists:', superAdminRole._id.toString());
    }

    // 3. Create a test admin user assigned to the Super Admin role
    const testEmail = 'admin@test.com';
    let adminUser = await User.findOne({ email: testEmail });
    if (!adminUser) {
      adminUser = await User.create({
        firstName: 'Test',
        lastName: 'Admin',
        email: testEmail,
        phoneNumber: '03000000000',
        password: 'Password123!', // will be hashed automatically by the User model's pre-save hook
        role: superAdminRole._id,
        status: 'active'
      });
      console.log('Created test admin user:', adminUser.email);
      console.log('Login with -> email: admin@test.com | password: Password123!');
    } else {
      console.log('Test admin user already exists:', adminUser.email);
      console.log('Login with -> email: admin@test.com | password: Password123!');
    }

    console.log('\nSeed complete.');
    process.exit(0);

  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

run();