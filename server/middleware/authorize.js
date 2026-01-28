const User = require('../models/User');

/**
 * Middleware to authorize specific roles
 * @param {...String} roles - Allowed roles
 */
module.exports = function(...roles) {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(401).json({ msg: 'User not found' });
            }

            if (!roles.includes(user.role)) {
                return res.status(403).json({ 
                    msg: `Access denied. Requires one of the following roles: ${roles.join(', ')}` 
                });
            }

            // Add user object to request for further use if needed
            req.fullUser = user;
            next();
        } catch (err) {
            console.error('Authorization middleware error:', err);
            res.status(500).json({ msg: 'Server Error' });
        }
    };
};
