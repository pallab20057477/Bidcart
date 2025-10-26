const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Predefined admin users from environment variables
    const adminUsers = [
      {
        name: process.env.ADMIN1_NAME || 'Pallab Das',
        email: process.env.ADMIN1_EMAIL || 'pallabdasdas2005@gmail.com',
        password: process.env.ADMIN1_PASSWORD || '123456',
        role: 'admin',
        phone: process.env.ADMIN1_PHONE || '',
        isVerified: true
      },
      {
        name: process.env.ADMIN2_NAME || 'Admin Two',
        email: process.env.ADMIN2_EMAIL || 'admin2@example.com',
        password: process.env.ADMIN2_PASSWORD || 'ChangeMe123!',
        role: 'admin',
        phone: process.env.ADMIN2_PHONE || '',
        isVerified: true
      },
      {
        name: process.env.ADMIN3_NAME || 'Admin Three',
        email: process.env.ADMIN3_EMAIL || 'admin3@example.com',
        password: process.env.ADMIN3_PASSWORD || 'ChangeMe123!',
        role: 'admin',
        phone: process.env.ADMIN3_PHONE || '',
        isVerified: true
      }
    ];

    let createdCount = 0;

    for (const adminData of adminUsers) {
      // Check if admin already exists
      const existingAdmin = await User.findOne({ email: adminData.email });
      if (existingAdmin) {
        continue;
      }

      // Create admin user
      const adminUser = new User(adminData);
      await adminUser.save();
      createdCount++;
    }

    if (createdCount > 0) {
      console.log(`Created ${createdCount} admin user(s)`);
    }

  } catch (error) {
    console.error('Error creating admin users:', error.message);
  }
  // Note: Connection is NOT closed here to allow main server to maintain connection
};

// Export the function to be used in index.js
module.exports = {
  createAdminUser
};
