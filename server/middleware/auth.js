const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('🔐 Auth middleware - Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.log('❌ Auth middleware - No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('🔓 Auth middleware - Token decoded for user:', decoded.userId);
    
    const user = await User.findById(decoded.userId);

    if (!user) {
      console.log('❌ Auth middleware - User not found for ID:', decoded.userId);
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    console.log('✅ Auth middleware - User authenticated:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }
      next();
    });
  } catch (error) {
    res.status(403).json({ message: 'Access denied.' });
  }
};

const vendorAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Vendor privileges required.' });
      }
      next();
    });
  } catch (error) {
    res.status(403).json({ message: 'Access denied.' });
  }
};

module.exports = { auth, adminAuth, vendorAuth }; 