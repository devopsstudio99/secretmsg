import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { errorHandler, ErrorResponse } from './error-handler.js';
import { ValidationError, AuthenticationError, NotFoundError } from '../types/message.js';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    mockNext = vi.fn();
  });

  it('should return 400 for ValidationError', () => {
    // Arrange
    const error = new ValidationError('Message content cannot be empty');
    const expectedResponse: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Message content cannot be empty'
      }
    };

    // Act
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
  });

  it('should return 401 for AuthenticationError', () => {
    // Arrange
    const error = new AuthenticationError('Incorrect password');
    const expectedResponse: ErrorResponse = {
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Incorrect password'
      }
    };

    // Act
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
  });

  it('should return 404 for NotFoundError', () => {
    // Arrange
    const error = new NotFoundError('The requested message does not exist');
    const expectedResponse: ErrorResponse = {
      error: {
        code: 'MESSAGE_NOT_FOUND',
        message: 'The requested message does not exist'
      }
    };

    // Act
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
  });

  it('should return 500 for unexpected errors', () => {
    // Arrange
    const error = new Error('Database connection failed');
    const expectedResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    };

    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unexpected error:', error);

    // Cleanup
    consoleErrorSpy.mockRestore();
  });

  it('should handle ValidationError with different messages', () => {
    // Arrange
    const error = new ValidationError('Password must be at least 4 characters long');
    const expectedResponse: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Password must be at least 4 characters long'
      }
    };

    // Act
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
  });
});
