import { Request, Response, NextFunction } from 'express';
import { ValidationError, AuthenticationError, NotFoundError } from '../types/message.js';

/**
 * Error response format
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Express error handling middleware
 * Converts application errors to consistent JSON responses
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Validation errors (400)
  if (err instanceof ValidationError) {
    const response: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message
      }
    };
    res.status(400).json(response);
    return;
  }

  // Authentication errors (401)
  if (err instanceof AuthenticationError) {
    const response: ErrorResponse = {
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: err.message
      }
    };
    res.status(401).json(response);
    return;
  }

  // Not found errors (404)
  if (err instanceof NotFoundError) {
    const response: ErrorResponse = {
      error: {
        code: 'MESSAGE_NOT_FOUND',
        message: err.message
      }
    };
    res.status(404).json(response);
    return;
  }

  // Default server error (500)
  console.error('Unexpected error:', err);
  const response: ErrorResponse = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  };
  res.status(500).json(response);
}
