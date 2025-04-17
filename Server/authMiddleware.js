const jwt = require('jsonwebtoken');

// Middleware to extract username from token
const extractUsernameFromToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Get the token from the Authorization header
  const token = req.headers.authorization.split(' ')[1];

  try {
    // Verify the token and decode the payload
    const decoded = jwt.verify(token, 'scrum-key');

    // Attach the username to the request
    req.username = decoded.username;

    // Continue with the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error decoding token:', error);
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

module.exports = { extractUsernameFromToken };