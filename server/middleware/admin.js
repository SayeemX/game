const User = require('../models/User');

/**
 * Strict Admin Middleware
 * Only allows access if:
 * 1. The user has the 'admin' role
 * 2. The username matches the ADMIN_USERNAME environment variable
 */
module.exports = async function(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'admin' || user.username !== process.env.ADMIN_USERNAME) {
      return res.status(403).json({ msg: 'Access denied. This area is restricted to the primary administrator.' });
    }
    
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
