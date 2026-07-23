// Import jsonwebtoken so we can verify tokens sent by the client
const jwt = require('jsonwebtoken');

// This is an Express middleware function - it runs BEFORE the controller
// It takes (req, res, next) - this "next" IS used here, unlike Mongoose hooks
const protect = async (req, res, next) => {
  try {
    // Get the Authorization header from the incoming request
    // Example format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    const authHeader = req.headers.authorization;

    // Check two things:
    // 1. Does the header exist at all?
    // 2. Does it start with the word "Bearer " (the standard convention)?
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // If either check fails, stop here and reject the request
      // We use "return" so the code below never runs after sending this response
      return res.status(401).json({ message: 'No token provided, access denied' });
    }

    // token verification will go here 
    // Extract just the token part, removing "Bearer " prefix
// "Bearer eyJhbGci..." -> split by space -> ["Bearer", "eyJhbGci..."] -> take index [1]
const token = authHeader.split(' ')[1];

// Verify the token using our secret key
// If the token is valid, this returns the original payload we signed it with (userId, role)
// If invalid/expired/tampered, this throws an error automatically (caught by our catch block)
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// Attach the decoded info to the request object
// Now every controller that runs AFTER this middleware can access req.user
req.user = decoded;

// Everything checked out - tell Express to proceed to the actual controller
next();

  } catch (error) {
    // If jwt.verify() throws (e.g., token expired, tampered, malformed),
    // it will be caught here and we reject with 401
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Export this so we can plug it into any route that needs protection
module.exports = { protect };