const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'londonrooms-secret-key';

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Please sign in first' });
  try {
    req.user = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please sign in again' });
  }
}

module.exports = { authRequired, JWT_SECRET };