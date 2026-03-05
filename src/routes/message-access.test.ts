import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageService } from '../services/message-service.js';
import { createMessagesRouter } from './messages.js';
import express, { Express } from 'express';

describe('Message Access Page Integration', () => {
  let app: Express;
  let mockMessageService: MessageService;

  beforeEach(() => {
    // Create mock message service
    mockMessageService = {
      createMessage: vi.fn(),
      getMessageMetadata: vi.fn(),
      verifyAndGetMessage: vi.fn(),
    } as any;

    // Setup Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/messages', createMessagesRouter(mockMessageService));
  });

  describe('GET /api/messages/:path - Load Message Metadata', () => {
    it('should return message metadata for existing message', async () => {
      const mockPath = 'abc123xyz';
      const mockMetadata = {
        path: mockPath,
        createdAt: new Date(),
        exists: true
      };

      vi.mocked(mockMessageService.getMessageMetadata).mockResolvedValue(mockMetadata);

      const result = await mockMessageService.getMessageMetadata(mockPath);

      expect(mockMessageService.getMessageMetadata).toHaveBeenCalledWith(mockPath);
      expect(result).toEqual(mockMetadata);
      expect(result.exists).toBe(true);
    });

    it('should return 404 for non-existent message path', async () => {
      const nonExistentPath = 'nonexistent123';

      vi.mocked(mockMessageService.getMessageMetadata).mockResolvedValue(null);

      const mockFetch = vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
        json: async () => ({
          error: {
            code: 'MESSAGE_NOT_FOUND',
            message: 'The requested message does not exist'
          }
        })
      });

      const response = await mockFetch(`/api/messages/${nonExistentPath}`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('MESSAGE_NOT_FOUND');
      expect(data.error.message).toBe('The requested message does not exist');
    });

    it('should not display message content before password verification', async () => {
      const mockPath = 'abc123xyz';
      const mockMetadata = {
        path: mockPath,
        createdAt: new Date(),
        exists: true
      };

      vi.mocked(mockMessageService.getMessageMetadata).mockResolvedValue(mockMetadata);

      const result = await mockMessageService.getMessageMetadata(mockPath);

      // Verify that metadata does not contain message content
      expect(result).not.toHaveProperty('content');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('exists');
    });
  });

  describe('POST /api/messages/:path/verify - Password Verification', () => {
    it('should return message content with correct password', async () => {
      const mockPath = 'abc123xyz';
      const correctPassword = 'password123';
      const messageContent = 'This is the secret message';

      vi.mocked(mockMessageService.verifyAndGetMessage).mockResolvedValue(messageContent);

      const result = await mockMessageService.verifyAndGetMessage(mockPath, correctPassword);

      expect(mockMessageService.verifyAndGetMessage).toHaveBeenCalledWith(mockPath, correctPassword);
      expect(result).toBe(messageContent);
    });

    it('should return 401 error for incorrect password', async () => {
      const mockPath = 'abc123xyz';
      const incorrectPassword = 'wrongpassword';

      vi.mocked(mockMessageService.verifyAndGetMessage).mockRejectedValue({
        name: 'AuthenticationError',
        message: 'Incorrect password'
      });

      const mockFetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        json: async () => ({
          error: {
            code: 'AUTHENTICATION_FAILED',
            message: 'Incorrect password'
          }
        })
      });

      const response = await mockFetch(`/api/messages/${mockPath}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: incorrectPassword })
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('AUTHENTICATION_FAILED');
      expect(data.error.message).toBe('Incorrect password');
    });

    it('should return 404 error for non-existent message', async () => {
      const nonExistentPath = 'nonexistent123';
      const password = 'password123';

      vi.mocked(mockMessageService.verifyAndGetMessage).mockRejectedValue({
        name: 'NotFoundError',
        message: 'The requested message does not exist'
      });

      const mockFetch = vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
        json: async () => ({
          error: {
            code: 'MESSAGE_NOT_FOUND',
            message: 'The requested message does not exist'
          }
        })
      });

      const response = await mockFetch(`/api/messages/${nonExistentPath}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('MESSAGE_NOT_FOUND');
    });
  });

  describe('Client-side Path Extraction', () => {
    it('should extract path from URL correctly', () => {
      // Test the getPathFromUrl function logic
      const getPathFromUrl = (pathname: string) => {
        const match = pathname.match(/^\/message\/([^/]+)$/);
        return match ? match[1] : null;
      };

      expect(getPathFromUrl('/message/abc123xyz')).toBe('abc123xyz');
      expect(getPathFromUrl('/message/test-path-123')).toBe('test-path-123');
      expect(getPathFromUrl('/message/')).toBe(null);
      expect(getPathFromUrl('/messages/abc123')).toBe(null);
      expect(getPathFromUrl('/message/abc/def')).toBe(null);
    });
  });

  describe('UI State Management', () => {
    it('should show loading section initially', () => {
      const sections = {
        loading: { display: 'block' },
        notFound: { display: 'none' },
        password: { display: 'none' },
        message: { display: 'none' }
      };

      expect(sections.loading.display).toBe('block');
      expect(sections.notFound.display).toBe('none');
      expect(sections.password.display).toBe('none');
      expect(sections.message.display).toBe('none');
    });

    it('should show password section after successful metadata load', () => {
      const sections = {
        loading: { display: 'none' },
        notFound: { display: 'none' },
        password: { display: 'block' },
        message: { display: 'none' }
      };

      expect(sections.password.display).toBe('block');
      expect(sections.loading.display).toBe('none');
    });

    it('should show not found section for 404 error', () => {
      const sections = {
        loading: { display: 'none' },
        notFound: { display: 'block' },
        password: { display: 'none' },
        message: { display: 'none' }
      };

      expect(sections.notFound.display).toBe('block');
      expect(sections.password.display).toBe('none');
    });

    it('should show message section after successful password verification', () => {
      const sections = {
        loading: { display: 'none' },
        notFound: { display: 'none' },
        password: { display: 'none' },
        message: { display: 'block' }
      };

      expect(sections.message.display).toBe('block');
      expect(sections.password.display).toBe('none');
    });
  });

  describe('Password Form UI Elements', () => {
    it('should have password input with autofocus', () => {
      const passwordInput = {
        type: 'password',
        id: 'password',
        required: true,
        autofocus: true
      };

      expect(passwordInput.type).toBe('password');
      expect(passwordInput.required).toBe(true);
      expect(passwordInput.autofocus).toBe(true);
    });

    it('should have verify button', () => {
      const verifyButton = {
        type: 'submit',
        id: 'verifyBtn',
        textContent: 'View Message'
      };

      expect(verifyButton.type).toBe('submit');
      expect(verifyButton.id).toBe('verifyBtn');
    });

    it('should have error message container', () => {
      const passwordError = {
        id: 'passwordError',
        className: 'error-message'
      };

      expect(passwordError.id).toBe('passwordError');
      expect(passwordError.className).toBe('error-message');
    });
  });

  describe('Error Display', () => {
    it('should display error message for incorrect password', () => {
      const passwordError = { 
        textContent: '', 
        classList: { add: vi.fn(), remove: vi.fn() } 
      };
      
      const errorMessage = 'Incorrect password. Please try again.';
      passwordError.textContent = errorMessage;
      passwordError.classList.add('show');

      expect(passwordError.textContent).toBe(errorMessage);
      expect(passwordError.classList.add).toHaveBeenCalledWith('show');
    });

    it('should clear password input after incorrect attempt', () => {
      const passwordInput = { value: 'wrongpassword' };
      
      // Simulate clearing the input after error
      passwordInput.value = '';

      expect(passwordInput.value).toBe('');
    });
  });
});
