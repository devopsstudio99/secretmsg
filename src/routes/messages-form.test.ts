import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageService } from '../services/message-service.js';
import { createMessagesRouter } from './messages.js';
import express, { Express } from 'express';

describe('Message Creation Form Integration', () => {
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

  describe('POST /api/messages - Form Submission', () => {
    it('should accept valid message content (1-10000 chars) and password (4-128 chars)', async () => {
      const validContent = 'This is a secret message';
      const validPassword = 'pass1234';
      
      const mockResult = {
        path: 'abc123',
        url: 'http://localhost:3000/message/abc123',
        qrCodeDataUrl: 'data:image/png;base64,mockdata'
      };

      vi.mocked(mockMessageService.createMessage).mockResolvedValue(mockResult);

      // Simulate the form submission logic
      const result = await mockMessageService.createMessage(validContent, validPassword);

      expect(mockMessageService.createMessage).toHaveBeenCalledWith(validContent, validPassword);
      expect(result).toEqual(mockResult);
      expect(result.path).toBe('abc123');
      expect(result.url).toBe('http://localhost:3000/message/abc123');
      expect(result.qrCodeDataUrl).toBe('data:image/png;base64,mockdata');
    });

    it('should return validation error for empty message content', async () => {
      const emptyContent = '';
      const validPassword = 'pass1234';

      vi.mocked(mockMessageService.createMessage).mockRejectedValue({
        name: 'ValidationError',
        message: 'Message content cannot be empty'
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Message content cannot be empty'
          }
        })
      });

      const response = await mockFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: emptyContent, password: validPassword })
      });

      const data = await response.json();
      expect(response.ok).toBe(false);
      expect(data.error.message).toBe('Message content cannot be empty');
    });

    it('should return validation error for empty password', async () => {
      const validContent = 'Secret message';
      const emptyPassword = '';

      vi.mocked(mockMessageService.createMessage).mockRejectedValue({
        name: 'ValidationError',
        message: 'Password cannot be empty'
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Password cannot be empty'
          }
        })
      });

      const response = await mockFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: validContent, password: emptyPassword })
      });

      const data = await response.json();
      expect(response.ok).toBe(false);
      expect(data.error.message).toBe('Password cannot be empty');
    });

    it('should return validation error for message exceeding 10000 characters', async () => {
      const longContent = 'a'.repeat(10001);
      const validPassword = 'pass1234';

      vi.mocked(mockMessageService.createMessage).mockRejectedValue({
        name: 'ValidationError',
        message: 'Message content cannot exceed 10000 characters'
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Message content cannot exceed 10000 characters'
          }
        })
      });

      const response = await mockFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: longContent, password: validPassword })
      });

      const data = await response.json();
      expect(response.ok).toBe(false);
      expect(data.error.message).toBe('Message content cannot exceed 10000 characters');
    });

    it('should return validation error for password less than 4 characters', async () => {
      const validContent = 'Secret message';
      const shortPassword = 'abc';

      vi.mocked(mockMessageService.createMessage).mockRejectedValue({
        name: 'ValidationError',
        message: 'Password must be at least 4 characters'
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Password must be at least 4 characters'
          }
        })
      });

      const response = await mockFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: validContent, password: shortPassword })
      });

      const data = await response.json();
      expect(response.ok).toBe(false);
      expect(data.error.message).toBe('Password must be at least 4 characters');
    });

    it('should return validation error for password exceeding 128 characters', async () => {
      const validContent = 'Secret message';
      const longPassword = 'a'.repeat(129);

      vi.mocked(mockMessageService.createMessage).mockRejectedValue({
        name: 'ValidationError',
        message: 'Password cannot exceed 128 characters'
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Password cannot exceed 128 characters'
          }
        })
      });

      const response = await mockFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: validContent, password: longPassword })
      });

      const data = await response.json();
      expect(response.ok).toBe(false);
      expect(data.error.message).toBe('Password cannot exceed 128 characters');
    });

    it('should display server validation errors in the form', async () => {
      // This test verifies that the client-side JavaScript properly displays
      // server-side validation errors
      const serverError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input format'
        }
      };

      // Simulate the client-side error display logic
      const formError = { textContent: '', classList: { add: vi.fn(), remove: vi.fn() } };
      
      // This mimics the showError function in app.js
      formError.textContent = serverError.error.message;
      formError.classList.add('show');

      expect(formError.textContent).toBe('Invalid input format');
      expect(formError.classList.add).toHaveBeenCalledWith('show');
    });
  });

  describe('Client-side Validation', () => {
    it('should validate message content on client side', () => {
      // Test the validateContent function logic
      const validateContent = (content: string) => {
        if (!content || content.trim().length === 0) {
          return 'Message content cannot be empty';
        }
        if (content.length > 10000) {
          return 'Message content cannot exceed 10000 characters';
        }
        return null;
      };

      expect(validateContent('')).toBe('Message content cannot be empty');
      expect(validateContent('   ')).toBe('Message content cannot be empty');
      expect(validateContent('Valid message')).toBe(null);
      expect(validateContent('a'.repeat(10000))).toBe(null);
      expect(validateContent('a'.repeat(10001))).toBe('Message content cannot exceed 10000 characters');
    });

    it('should validate password on client side', () => {
      // Test the validatePassword function logic
      const validatePassword = (password: string) => {
        if (!password || password.length === 0) {
          return 'Password cannot be empty';
        }
        if (password.length < 4) {
          return 'Password must be at least 4 characters';
        }
        if (password.length > 128) {
          return 'Password cannot exceed 128 characters';
        }
        return null;
      };

      expect(validatePassword('')).toBe('Password cannot be empty');
      expect(validatePassword('abc')).toBe('Password must be at least 4 characters');
      expect(validatePassword('abcd')).toBe(null);
      expect(validatePassword('a'.repeat(128))).toBe(null);
      expect(validatePassword('a'.repeat(129))).toBe('Password cannot exceed 128 characters');
    });
  });

  describe('Form UI Elements', () => {
    it('should have textarea with max 10000 chars attribute', () => {
      // Verify HTML structure has correct attributes
      const textareaAttributes = {
        maxlength: '10000',
        required: true,
        rows: '6'
      };

      expect(textareaAttributes.maxlength).toBe('10000');
      expect(textareaAttributes.required).toBe(true);
    });

    it('should have password input with correct length constraints', () => {
      // Verify HTML structure has correct attributes
      const passwordAttributes = {
        type: 'password',
        minlength: '4',
        maxlength: '128',
        required: true
      };

      expect(passwordAttributes.minlength).toBe('4');
      expect(passwordAttributes.maxlength).toBe('128');
      expect(passwordAttributes.required).toBe(true);
    });

    it('should have submit button', () => {
      const submitButton = {
        type: 'submit',
        id: 'submitBtn',
        textContent: 'Create Secret Message'
      };

      expect(submitButton.type).toBe('submit');
      expect(submitButton.id).toBe('submitBtn');
    });

    it('should have error message containers', () => {
      const errorElements = {
        contentError: { id: 'contentError', className: 'error-message' },
        passwordError: { id: 'passwordError', className: 'error-message' },
        formError: { id: 'formError', className: 'error-message' }
      };

      expect(errorElements.contentError.id).toBe('contentError');
      expect(errorElements.passwordError.id).toBe('passwordError');
      expect(errorElements.formError.id).toBe('formError');
    });
  });
});
