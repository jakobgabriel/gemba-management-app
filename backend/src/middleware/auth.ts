import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface UserPayload {
  id: string;
  username: string;
  role: string;
  roleLevel: number;
  plantId: string;
}

// Extend the Express Request type to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

/**
 * Middleware that extracts a Bearer token from the Authorization header,
 * verifies it, and attaches the decoded user payload to `req.user`.
 *
 * Returns 401 if the token is missing or invalid.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      data: null,
      meta: null,
      errors: [{ code: 'UNAUTHORIZED', message: 'Authentication token is required' }],
    });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as UserPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      data: null,
      meta: null,
      errors: [{ code: 'INVALID_TOKEN', message: 'Invalid or expired token' }],
    });
  }
}

/**
 * Middleware factory that checks whether the authenticated user has a role
 * level equal to or above the required minimum.
 *
 * Must be used after `authenticate`.
 *
 * Returns 403 if the user's role level is insufficient.
 */
export function requireRole(minLevel: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        data: null,
        meta: null,
        errors: [{ code: 'UNAUTHORIZED', message: 'Authentication is required' }],
      });
      return;
    }

    if (req.user.roleLevel < minLevel) {
      res.status(403).json({
        data: null,
        meta: null,
        errors: [{ code: 'FORBIDDEN', message: 'Insufficient permissions' }],
      });
      return;
    }

    next();
  };
}
