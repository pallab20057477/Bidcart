
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const jwt = require('jsonwebtoken');

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    const user = new User({ name, email, password, phone });
    await user.save();
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  console.log('\n=== LOGIN REQUEST ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    console.log('\n=== LOGIN ATTEMPT ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { email, password, role } = req.body; // Accept role
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    console.log('Looking for user with email:', email);
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    
    console.log('User found:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive
    });
    console.log('User found. Checking password...');
    let isPasswordValid = false;
    try {
      isPasswordValid = await user.comparePassword(password);
    } catch (error) {
      console.error('Error comparing passwords:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error validating credentials',
        error: error.message 
      });
    }
    
    if (!isPasswordValid) {
      console.log('Invalid password');
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    console.log(`Login attempt - Email: ${email}, Role requested: ${role}, User's actual role: ${user.role}`);

    // Check if user is a vendor when they try to log in as vendor
    if (role === 'vendor') {
      const Vendor = require('../models/Vendor');
      const vendorDoc = await Vendor.findOne({ user: user._id });
      
      // If vendor document exists and is approved, update user role to vendor if needed
      if (vendorDoc && vendorDoc.status === 'approved' && user.role !== 'vendor') {
        console.log(`Updating user role to vendor for user: ${user._id}`);
        user.role = 'vendor';
        await user.save();
      }
      
      // Now check if vendor document exists and is approved
      if (!vendorDoc || vendorDoc.status !== 'approved') {
        return res.status(403).json({ success: false, message: 'Your vendor account is not approved yet.' });
      }
    }
    
    // Relaxed role enforcement - only check if user is trying to log in as admin
    if (role === 'admin' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to log in as admin' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('\n=== LOGIN ERROR ===');
    console.error('Error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'MongoError') {
      console.error('MongoDB Error:', error.message);
      if (error.code === 11000) {
        return res.status(400).json({ 
          success: false, 
          message: 'Database error: Duplicate key',
          details: error.keyValue
        });
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    console.log('📝 Profile update request:', req.body);
    const { name, phone, address } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    
    await user.save();
    console.log('✅ Profile updated successfully for user:', user._id);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Search users (Admin only)
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ users: [] });
    }
    const searchRegex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    })
      .select('name email role')
      .limit(10)
      .sort({ name: 1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get vendor status for current user
const getVendorStatus = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (vendor) {
      res.json({
        success: true,
        vendor: {
          _id: vendor._id,
          businessName: vendor.businessName,
          status: vendor.status,
          approvalDate: vendor.approvalDate,
          isActive: vendor.isActive
        }
      });
    } else {
      res.json({
        success: true,
        vendor: null
      });
    }
  } catch (error) {
    console.error('Error checking vendor status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  searchUsers,
  getMe,
  getVendorStatus,
}; 