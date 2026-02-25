import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config.js';

/**
 * Custom application error with an HTTP status code and machine-readable code.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global Express error-handling middleware.
 *
 * Handles:
 * - AppError instances -> responds with their status code and code
 * - ZodError instances -> responds with 400 and field-level details
 * - Unknown errors     -> responds with 500 Internal Server Error
 *
 * Response shape follows the API standard format:
 * { data: null, meta: null, errors: [{ code, field?, message }] }
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // --- AppError ---
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      data: null,
      meta: null,
      errors: [{ code: err.code, message: err.message }],
    });
    return;
  }

  // --- ZodError (validation) ---
  if (err instanceof ZodError) {
    const fieldErrors = err.errors.map((issue) => ({
      code: 'VALIDATION_ERROR',
      field: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(400).json({
      data: null,
      meta: null,
      errors: fieldErrors,
    });
    return;
  }

  // --- Unknown / unexpected errors ---
  if (config.nodeEnv !== 'production') {
    console.error('Unhandled error:', err);
  }

  const message =
    config.nodeEnv === 'production'
      ? 'Internal server error'
      : err instanceof Error
        ? err.message
        : 'Internal server error';

  res.status(500).json({
    data: null,
    meta: null,
    errors: [{ code: 'INTERNAL_ERROR', message }],
  });
}
