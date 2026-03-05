import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageService } from './message-service.js';
import { PasswordService } from './password.js';
import { PathGeneratorService } from './path-generator.js';
import { QRCodeGenerator } from './qr-generator.js';
import { MessageRepository } from '../repositories/message-repository.js';
import { ValidationError, AuthenticationError, NotFoundError } from '../types/message.js';
import { MessageEntity } from '../types/message.js';

describe('MessageService', () => {
  let messageService: MessageService;
  let mockPasswordService: PasswordService;
  let mockPathGenerator: PathGeneratorService;
  let mockQrGenerator: QRCodeGenerator;
  let mockRepository: MessageRepository;

  beforeEach(() => {
    // Create mock services
    mockPasswordService = {
      hashPassword: vi.fn(),
      verifyPassword: vi.fn(),
    } as any;

    mockPathGenerator = {
      generateUniquePath: vi.fn(),
    } as any;

    mockQrGenerator = {
      generateQRCode: vi.fn(),
    } as any;

    mockRepository = {
      save: vi.fn(),
      findByPath: vi.fn(),
      existsByPath: vi.fn(),
    } as any;

    messageService = new MessageService(
      mockPasswordService,
      mockPathGenerator,
      mockQrGenerator,
      mockRepository,
      'https://example.com'
    );
  });

  describe('createMessage', () => {
    it('should create a message with valid inputs', async () => {
      // Arrange
      const content = 'This is a secret message';
      const password = 'password123';
      const path = 'abc123xyz';
      const passwordHash = '$2b$10$hashedpassword';
      const qrCodeDataUrl = 'data:image/png;base64,abc123';

      vi.mocked(mockPathGenerator.generateUniquePath).mockResolvedValue(path);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue(passwordHash);
      vi.mocked(mockQrGenerator.generateQRCode).mockResolvedValue(qrCodeDataUrl);
      vi.mocked(mockRepository.save).mockResolvedValue({
        id: '123',
        path,
        content,
        passwordHash,
        createdAt: new Date(),
      });

      // Act
      const result = await messageService.createMessage(content, password);

      // Assert
      expect(result).toEqual({
        path,
        url: `https://example.com/message/${path}`,
        qrCodeDataUrl,
      });
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(password);
      expect(mockPathGenerator.generateUniquePath).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith({
        path,
        content,
        passwordHash,
      });
      expect(mockQrGenerator.generateQRCode).toHaveBeenCalledWith(`https://example.com/message/${path}`);
    });

    it('should throw ValidationError for empty message content', async () => {
      await expect(messageService.createMessage('', 'password123'))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty password', async () => {
      await expect(messageService.createMessage('Valid message', ''))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for message exceeding 10000 characters', async () => {
      const longMessage = 'a'.repeat(10001);
      await expect(messageService.createMessage(longMessage, 'password123'))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for password less than 4 characters', async () => {
      await expect(messageService.createMessage('Valid message', 'abc'))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for password exceeding 128 characters', async () => {
      const longPassword = 'a'.repeat(129);
      await expect(messageService.createMessage('Valid message', longPassword))
        .rejects.toThrow(ValidationError);
    });

    it('should accept message at 10000 character boundary', async () => {
      const content = 'a'.repeat(10000);
      const password = 'password123';
      const path = 'abc123xyz';
      const passwordHash = '$2b$10$hashedpassword';
      const qrCodeDataUrl = 'data:image/png;base64,abc123';

      vi.mocked(mockPathGenerator.generateUniquePath).mockResolvedValue(path);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue(passwordHash);
      vi.mocked(mockQrGenerator.generateQRCode).mockResolvedValue(qrCodeDataUrl);
      vi.mocked(mockRepository.save).mockResolvedValue({
        id: '123',
        path,
        content,
        passwordHash,
        createdAt: new Date(),
      });

      const result = await messageService.createMessage(content, password);
      expect(result.path).toBe(path);
    });

    it('should accept password at 4 character boundary', async () => {
      const content = 'Valid message';
      const password = 'pass';
      const path = 'abc123xyz';
      const passwordHash = '$2b$10$hashedpassword';
      const qrCodeDataUrl = 'data:image/png;base64,abc123';

      vi.mocked(mockPathGenerator.generateUniquePath).mockResolvedValue(path);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue(passwordHash);
      vi.mocked(mockQrGenerator.generateQRCode).mockResolvedValue(qrCodeDataUrl);
      vi.mocked(mockRepository.save).mockResolvedValue({
        id: '123',
        path,
        content,
        passwordHash,
        createdAt: new Date(),
      });

      const result = await messageService.createMessage(content, password);
      expect(result.path).toBe(path);
    });

    it('should accept password at 128 character boundary', async () => {
      const content = 'Valid message';
      const password = 'a'.repeat(128);
      const path = 'abc123xyz';
      const passwordHash = '$2b$10$hashedpassword';
      const qrCodeDataUrl = 'data:image/png;base64,abc123';

      vi.mocked(mockPathGenerator.generateUniquePath).mockResolvedValue(path);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue(passwordHash);
      vi.mocked(mockQrGenerator.generateQRCode).mockResolvedValue(qrCodeDataUrl);
      vi.mocked(mockRepository.save).mockResolvedValue({
        id: '123',
        path,
        content,
        passwordHash,
        createdAt: new Date(),
      });

      const result = await messageService.createMessage(content, password);
      expect(result.path).toBe(path);
    });
  });

  describe('getMessageMetadata', () => {
    it('should return metadata for existing message', async () => {
      const path = 'abc123xyz';
      const createdAt = new Date();
      const message: MessageEntity = {
        id: '123',
        path,
        content: 'Secret content',
        passwordHash: '$2b$10$hashedpassword',
        createdAt,
      };

      vi.mocked(mockRepository.findByPath).mockResolvedValue(message);

      const result = await messageService.getMessageMetadata(path);

      expect(result).toEqual({
        path,
        createdAt,
        exists: true,
      });
      expect(mockRepository.findByPath).toHaveBeenCalledWith(path);
    });

    it('should return null for non-existent message', async () => {
      vi.mocked(mockRepository.findByPath).mockResolvedValue(null);

      const result = await messageService.getMessageMetadata('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('verifyAndGetMessage', () => {
    it('should return message content with correct password', async () => {
      const path = 'abc123xyz';
      const password = 'password123';
      const content = 'This is the secret message';
      const message: MessageEntity = {
        id: '123',
        path,
        content,
        passwordHash: '$2b$10$hashedpassword',
        createdAt: new Date(),
      };

      vi.mocked(mockRepository.findByPath).mockResolvedValue(message);
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);

      const result = await messageService.verifyAndGetMessage(path, password);

      expect(result).toBe(content);
      expect(mockRepository.findByPath).toHaveBeenCalledWith(path);
      expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith(password, message.passwordHash);
    });

    it('should throw AuthenticationError with incorrect password', async () => {
      const path = 'abc123xyz';
      const password = 'wrongpassword';
      const message: MessageEntity = {
        id: '123',
        path,
        content: 'Secret content',
        passwordHash: '$2b$10$hashedpassword',
        createdAt: new Date(),
      };

      vi.mocked(mockRepository.findByPath).mockResolvedValue(message);
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(false);

      await expect(messageService.verifyAndGetMessage(path, password))
        .rejects.toThrow(AuthenticationError);
      await expect(messageService.verifyAndGetMessage(path, password))
        .rejects.toThrow('Incorrect password');
    });

    it('should throw NotFoundError for non-existent message', async () => {
      vi.mocked(mockRepository.findByPath).mockResolvedValue(null);

      await expect(messageService.verifyAndGetMessage('nonexistent', 'password123'))
        .rejects.toThrow(NotFoundError);
      await expect(messageService.verifyAndGetMessage('nonexistent', 'password123'))
        .rejects.toThrow('The requested message does not exist');
    });
  });
});
