const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  let token = req.header('Authorization');
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  } else {
    token = req.header('x-auth-token');
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Standardize user object
    const user = decoded.user || decoded;
    const userId = user.id || decoded.id;
    
    req.user = { ...user, id: userId };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
