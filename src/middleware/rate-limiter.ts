import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiter for password verification endpoint
 * Limits to 5 attempts per minute per IP address
 */
export const passwordVerificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per window
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password attempts. Please try again later.'
    }
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Custom handler for rate limit exceeded
  handler: (req: Request, res: Response) => {
    // Log failed authentication attempt
    console.warn(`Rate limit exceeded for IP: ${req.ip || req.socket.remoteAddress} on path: ${req.path}`);
    
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many password attempts. Please try again later.'
      }
    });
  },
  // Skip successful requests from counting (optional - only count failed attempts)
  skip: (req: Request) => {
    // We'll count all requests to the verify endpoint
    return false;
  }
});

/**
 * Logs failed authentication attempts
 * This middleware should be used after password verification fails
 */
export function logFailedAuthAttempt(req: Request): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const path = req.params.path || 'unknown';
  const timestamp = new Date().toISOString();
  
  console.warn(`[${timestamp}] Failed authentication attempt - IP: ${ip}, Path: ${path}`);
}
