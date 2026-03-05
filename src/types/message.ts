/**
 * Message Entity Interface
 * Represents a secret message stored in the database
 */
export interface MessageEntity {
  id: string;                    // Primary key (UUID)
  path: string;                  // Unique random path (indexed)
  content: string;               // Message content (1-10000 chars)
  passwordHash: string;          // Hashed password with salt
  createdAt: Date;              // Creation timestamp
  expiresAt?: Date;             // Optional expiration (future enhancement)
}

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * Custom error class for authentication failures
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthenticationError);
    }
  }
}

/**
 * Custom error class for not found errors
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError);
    }
  }
}

/**
 * Validates message content according to requirements
 * @param content - The message content to validate
 * @throws ValidationError if content is invalid
 */
export function validateMessageContent(content: string): void {
  if (!content || content.length === 0) {
    throw new ValidationError('Message content cannot be empty');
  }
  
  if (content.length > 10000) {
    throw new ValidationError('Message content cannot exceed 10000 characters');
  }
}

/**
 * Validates password according to requirements
 * @param password - The password to validate
 * @throws ValidationError if password is invalid
 */
export function validatePassword(password: string): void {
  if (!password || password.length === 0) {
    throw new ValidationError('Password cannot be empty');
  }
  
  if (password.length < 4) {
    throw new ValidationError('Password must be at least 4 characters long');
  }
  
  if (password.length > 128) {
    throw new ValidationError('Password cannot exceed 128 characters');
  }
}
