const User = require('../models/User');

/**
 * Strict Admin Middleware
 * Only allows access if:
 * 1. The user has the 'admin' role
 * 2. The username matches the ADMIN_USERNAME environment variable
 */
module.exports = async function(req, res, next) {
  try {
    const userId = req.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ msg: 'No user ID found, authorization denied' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if user is the primary admin by username OR has the 'admin' role
    const adminUsername = process.env.ADMIN_USERNAME;
    const isPrimaryAdmin = adminUsername && user.username.toLowerCase() === adminUsername.toLowerCase();
    const hasAdminRole = user.role === 'admin';

    if (!isPrimaryAdmin && !hasAdminRole) {
      console.log(`Forbidden admin access attempt by: ${user.username} (Role: ${user.role})`);
      return res.status(403).json({ msg: 'Access denied. This area is restricted to administrators.' });
    }
    
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
