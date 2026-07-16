import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'londonrooms-secret-key';

// Define what a decoded JWT payload looks like
export interface DecodedUser {
  id: number | string;
  email: string;
  role?: string;
  [key: string]: any; // Allow other custom JWT fields
}

// Extend Express's Request interface to include the user property
export interface AuthenticatedRequest extends Request {
  user?: DecodedUser;
}

export function authRequired(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: 'Please sign in first' });
  }

  try {
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedUser;
    
    // Safely assign the decoded payload to our custom Request object
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please sign in again' });
  }
}
module.exports = { authRequired, JWT_SECRET };