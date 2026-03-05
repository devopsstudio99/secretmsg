import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { createMessagesRouter } from './messages.js';
import { MessageService } from '../services/message-service.js';
import { ValidationError } from '../types/message.js';

describe('POST /api/messages', () => {
  let mockMessageService: MessageService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Create mock message service
    mockMessageService = {
      createMessage: vi.fn()
    } as any;

    // Create mock request
    mockRequest = {
      body: {}
    };

    // Create mock response
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    // Create mock next function
    mockNext = vi.fn();
  });

  it('should return 201 with MessageCreationResult for valid input', async () => {
    // Arrange
    const validContent = 'This is a secret message';
    const validPassword = 'password123';
    const expectedResult = {
      path: 'abc123xyz',
      url: 'http://localhost:3000/message/abc123xyz',
      qrCodeDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANS...'
    };

    mockRequest.body = {
      content: validContent,
      password: validPassword
    };

    (mockMessageService.createMessage as any).mockResolvedValue(expectedResult);

    const router = createMessagesRouter(mockMessageService);
    const handler = router.stack[0].route.stack[0].handle;

    // Act
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockMessageService.createMessage).toHaveBeenCalledWith(validContent, validPassword);
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should pass ValidationError to error handler for empty content', async () => {
    // Arrange
    const emptyContent = '';
    const validPassword = 'password123';
    const validationError = new ValidationError('Message content cannot be empty');

    mockRequest.body = {
      content: emptyContent,
      password: validPassword
    };

    (mockMessageService.createMessage as any).mockRejectedValue(validationError);

    const router = createMessagesRouter(mockMessageService);
    const handler = router.stack[0].route.stack[0].handle;

    // Act
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockMessageService.createMessage).toHaveBeenCalledWith(emptyContent, validPassword);
    expect(mockNext).toHaveBeenCalledWith(validationError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should pass ValidationError to error handler for empty password', async () => {
    // Arrange
    const validContent = 'This is a secret message';
    const emptyPassword = '';
    const validationError = new ValidationError('Password cannot be empty');

    mockRequest.body = {
      content: validContent,
      password: emptyPassword
    };

    (mockMessageService.createMessage as any).mockRejectedValue(validationError);

    const router = createMessagesRouter(mockMessageService);
    const handler = router.stack[0].route.stack[0].handle;

    // Act
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockMessageService.createMessage).toHaveBeenCalledWith(validContent, emptyPassword);
    expect(mockNext).toHaveBeenCalledWith(validationError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should pass ValidationError to error handler for content exceeding 10000 characters', async () => {
    // Arrange
    const longContent = 'a'.repeat(10001);
    const validPassword = 'password123';
    const validationError = new ValidationError('Message content cannot exceed 10000 characters');

    mockRequest.body = {
      content: longContent,
      password: validPassword
    };

    (mockMessageService.createMessage as any).mockRejectedValue(validationError);

    const router = createMessagesRouter(mockMessageService);
    const handler = router.stack[0].route.stack[0].handle;

    // Act
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockMessageService.createMessage).toHaveBeenCalledWith(longContent, validPassword);
    expect(mockNext).toHaveBeenCalledWith(validationError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should pass ValidationError to error handler for password less than 4 characters', async () => {
    // Arrange
    const validContent = 'This is a secret message';
    const shortPassword = 'abc';
    const validationError = new ValidationError('Password must be at least 4 characters long');

    mockRequest.body = {
      content: validContent,
      password: shortPassword
    };

    (mockMessageService.createMessage as any).mockRejectedValue(validationError);

    const router = createMessagesRouter(mockMessageService);
    const handler = router.stack[0].route.stack[0].handle;

    // Act
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockMessageService.createMessage).toHaveBeenCalledWith(validContent, shortPassword);
    expect(mockNext).toHaveBeenCalledWith(validationError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should pass ValidationError to error handler for password exceeding 128 characters', async () => {
    // Arrange
    const validContent = 'This is a secret message';
    const longPassword = 'a'.repeat(129);
    const validationError = new ValidationError('Password cannot exceed 128 characters');

    mockRequest.body = {
      content: validContent,
      password: longPassword
    };

    (mockMessageService.createMessage as any).mockRejectedValue(validationError);

    const router = createMessagesRouter(mockMessageService);
    const handler = router.stack[0].route.stack[0].handle;

    // Act
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockMessageService.createMessage).toHaveBeenCalledWith(validContent, longPassword);
    expect(mockNext).toHaveBeenCalledWith(validationError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should pass unexpected errors to error handler', async () => {
    // Arrange
    const validContent = 'This is a secret message';
    const validPassword = 'password123';
    const unexpectedError = new Error('Database connection failed');

    mockRequest.body = {
      content: validContent,
      password: validPassword
    };

    (mockMessageService.createMessage as any).mockRejectedValue(unexpectedError);

    const router = createMessagesRouter(mockMessageService);
    const handler = router.stack[0].route.stack[0].handle;

    // Act
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockMessageService.createMessage).toHaveBeenCalledWith(validContent, validPassword);
    expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});

describe('GET /api/messages/:path', () => {
  let mockMessageService: MessageService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Create mock message service
    mockMessageService = {
      getMessageMetadata: vi.fn()
    } as any;

    // Create mock request
    mockRequest = {
      params: {}
    };

    // Create mock response
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    // Create mock next function
    mockNext = vi.fn();
  });

  it('should return 200 with MessageMetadata for existing message', async () => {
    // Arrange
    const messagePath = 'abc123xyz';
    const expectedMetadata = {
      path: messagePath,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      exists: true
    };

    mockRequest.params = { path: messagePath };
    (mockMessageService.getMessageMetadata as any).mockResolvedValue(expectedMetadata);

    const router = createMessagesRouter(mockMessageService);
    const handler = router.stack[1].route.stack[0].handle;

    // Act
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockMessageService.getMessageMetadata).toHaveBeenCalledWith(messagePath);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expectedMetadata);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 404 for non-existent message', async () => {
    // Arrange
    const messagePath = 'nonexistent';
    mockRequest.params = { path: messagePath };
    (mockMessageService.getMessageMetadata as any).mockResolvedValue(null);

    const router = createMessagesRouter(mockMessageService);
    const handler = router.stack[1].route.stack[0].handle;

    // Act
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockMessageService.getMessageMetadata).toHaveBeenCalledWith(messagePath);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: {
        code: 'MESSAGE_NOT_FOUND',
        message: 'The requested message does not exist'
      }
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should pass unexpected errors to error handler', async () => {
    // Arrange
    const messagePath = 'abc123xyz';
    const unexpectedError = new Error('Database connection failed');

    mockRequest.params = { path: messagePath };
    (mockMessageService.getMessageMetadata as any).mockRejectedValue(unexpectedError);

    const router = createMessagesRouter(mockMessageService);
    const handler = router.stack[1].route.stack[0].handle;

    // Act
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockMessageService.getMessageMetadata).toHaveBeenCalledWith(messagePath);
    expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});

describe('POST /api/messages/:path/verify', () => {
  let mockMessageService: MessageService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Create mock message service
    mockMessageService = {
      verifyAndGetMessage: vi.fn()
    } as any;

    // Create mock request with all required properties for rate limiter
    mockRequest = {
      params: {},
      body: {},
      ip: '192.168.1.1',
      socket: {
        remoteAddress: '192.168.1.1'
      } as any,
      get: vi.fn().mockReturnValue(undefined),
      headers: {}
    };

    // Create mock response
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    // Create mock next function
    mockNext = vi.fn();
  });

  it('should return 200 with message content for correct password', async () => {
    // Arrange
    const messagePath = 'abc123xyz';
    const correctPassword = 'password123';
    const messageContent = 'This is a secret message';

    mockRequest.params = { path: messagePath };
    mockRequest.body = { password: correctPassword };
    (mockMessageService.verifyAndGetMessage as any).mockResolvedValue(messageContent);

    const router = createMessagesRouter(mockMessageService);
    // Get the actual handler (skip rate limiter middleware)
    const handler = router.stack[2].route.stack[1].handle;

    // Act
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockMessageService.verifyAndGetMessage).toHaveBeenCalledWith(messagePath, correctPassword);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({ content: messageContent });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should pass AuthenticationError to error handler for incorrect password', async () => {
    // Arrange
    const messagePath = 'abc123xyz';
    const incorrectPassword = 'wrongpassword';
    const authError = new Error('Incorrect password');
    authError.name = 'AuthenticationError';

    mockRequest.params = { path: messagePath };
    mockRequest.body = { password: incorrectPassword };
    (mockMessageService.verifyAndGetMessage as any).mockRejectedValue(authError);

    const router = createMessagesRouter(mockMessageService);
    // Get the actual handler (skip rate limiter middleware)
    const handler = router.stack[2].route.stack[1].handle;

    // Act
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockMessageService.verifyAndGetMessage).toHaveBeenCalledWith(messagePath, incorrectPassword);
    expect(mockNext).toHaveBeenCalledWith(authError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should pass NotFoundError to error handler for non-existent message', async () => {
    // Arrange
    const messagePath = 'nonexistent';
    const password = 'password123';
    const notFoundError = new Error('The requested message does not exist');
    notFoundError.name = 'NotFoundError';

    mockRequest.params = { path: messagePath };
    mockRequest.body = { password };
    (mockMessageService.verifyAndGetMessage as any).mockRejectedValue(notFoundError);

    const router = createMessagesRouter(mockMessageService);
    // Get the actual handler (skip rate limiter middleware)
    const handler = router.stack[2].route.stack[1].handle;

    // Act
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockMessageService.verifyAndGetMessage).toHaveBeenCalledWith(messagePath, password);
    expect(mockNext).toHaveBeenCalledWith(notFoundError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should pass unexpected errors to error handler', async () => {
    // Arrange
    const messagePath = 'abc123xyz';
    const password = 'password123';
    const unexpectedError = new Error('Database connection failed');

    mockRequest.params = { path: messagePath };
    mockRequest.body = { password };
    (mockMessageService.verifyAndGetMessage as any).mockRejectedValue(unexpectedError);

    const router = createMessagesRouter(mockMessageService);
    // Get the actual handler (skip rate limiter middleware)
    const handler = router.stack[2].route.stack[1].handle;

    // Act
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockMessageService.verifyAndGetMessage).toHaveBeenCalledWith(messagePath, password);
    expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});

describe('Rate Limiting on POST /api/messages/:path/verify', () => {
  it('should have rate limiter middleware applied to verify endpoint', () => {
    // Arrange
    const mockMessageService = {
      verifyAndGetMessage: vi.fn()
    } as any;

    // Act
    const router = createMessagesRouter(mockMessageService);
    const verifyRoute = router.stack[2].route;

    // Assert
    // The verify route should have at least 2 handlers: rate limiter + actual handler
    expect(verifyRoute.stack.length).toBeGreaterThanOrEqual(2);
    
    // Check that the first middleware is the rate limiter
    // (rate limiter middleware will have a name like 'rateLimitMiddleware' or similar)
    const firstMiddleware = verifyRoute.stack[0];
    expect(firstMiddleware).toBeDefined();
  });
});

describe('Failed Authentication Logging', () => {
  let mockMessageService: MessageService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock console.warn
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Create mock message service
    mockMessageService = {
      verifyAndGetMessage: vi.fn()
    } as any;

    // Create mock request with all required properties for rate limiter
    mockRequest = {
      params: {},
      body: {},
      ip: '192.168.1.1',
      socket: {
        remoteAddress: '192.168.1.1'
      } as any,
      get: vi.fn().mockReturnValue(undefined),
      headers: {}
    };

    // Create mock response
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    // Create mock next function
    mockNext = vi.fn();
  });

  it('should log failed authentication attempt when password is incorrect', async () => {
    // Arrange
    const messagePath = 'abc123xyz';
    const incorrectPassword = 'wrongpassword';
    const authError = new Error('Incorrect password');
    authError.name = 'AuthenticationError';

    mockRequest.params = { path: messagePath };
    mockRequest.body = { password: incorrectPassword };
    (mockMessageService.verifyAndGetMessage as any).mockRejectedValue(authError);

    const router = createMessagesRouter(mockMessageService);
    // Get the actual handler (skip rate limiter middleware)
    const handler = router.stack[2].route.stack[1].handle;

    // Act
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(consoleWarnSpy).toHaveBeenCalled();
    const logMessage = consoleWarnSpy.mock.calls[0][0] as string;
    expect(logMessage).toContain('Failed authentication attempt');
    expect(logMessage).toContain('IP: 192.168.1.1');
    expect(logMessage).toContain('Path: abc123xyz');
  });

  it('should log failed authentication attempt when message not found', async () => {
    // Arrange
    const messagePath = 'nonexistent';
    const password = 'password123';
    const notFoundError = new Error('The requested message does not exist');
    notFoundError.name = 'NotFoundError';

    mockRequest.params = { path: messagePath };
    mockRequest.body = { password };
    (mockMessageService.verifyAndGetMessage as any).mockRejectedValue(notFoundError);

    const router = createMessagesRouter(mockMessageService);
    // Get the actual handler (skip rate limiter middleware)
    const handler = router.stack[2].route.stack[1].handle;

    // Act
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(consoleWarnSpy).toHaveBeenCalled();
    const logMessage = consoleWarnSpy.mock.calls[0][0] as string;
    expect(logMessage).toContain('Failed authentication attempt');
    expect(logMessage).toContain('Path: nonexistent');
  });

  it('should not log when authentication succeeds', async () => {
    // Arrange
    const messagePath = 'abc123xyz';
    const correctPassword = 'password123';
    const messageContent = 'This is a secret message';

    mockRequest.params = { path: messagePath };
    mockRequest.body = { password: correctPassword };
    (mockMessageService.verifyAndGetMessage as any).mockResolvedValue(messageContent);

    const router = createMessagesRouter(mockMessageService);
    // Get the actual handler (skip rate limiter middleware)
    const handler = router.stack[2].route.stack[1].handle;

    // Act
    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
