const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware to protect routes by verifying the token
const protect = async (req, res, next) => {
  let token;

  // Check if the Authorization header is present and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract the token from the Authorization header
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using the secret
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined');
        return res.status(500).json({ message: 'Internal server error: JWT_SECRET is not defined' });
      }

      // Verify and decode the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the user from the database using the decoded ID
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
    }
  } else {
    // Handle cases where no token is provided
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to check if the user is an admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // User is admin, proceed to next middleware or route handler
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };
