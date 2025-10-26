const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

const vendor = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }
    if (user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor privileges required.' });
    }
    // Optional: Check vendor approval status
    const vendorDoc = await Vendor.findOne({ user: user._id });
    if (!vendorDoc || vendorDoc.status !== 'approved') {
      return res.status(403).json({ message: 'Access denied. Vendor account not approved.' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = vendor; 