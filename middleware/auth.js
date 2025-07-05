// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    // Don’t send a response — just skip and let resolver handle it
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      req.user = null;
    } else {
      req.user = user;
    }
  } catch (err) {
    req.user = null; // Invalid token
  }

  next();
};

module.exports = authMiddleware;
