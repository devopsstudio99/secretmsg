import { describe, it, expect } from 'vitest';
import { 
  validateMessageContent, 
  validatePassword, 
  ValidationError,
  type MessageEntity 
} from './message';

describe('ValidationError', () => {
  it('should create a ValidationError with correct name and message', () => {
    const error = new ValidationError('Test error');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Test error');
  });

  it('should have a stack trace', () => {
    const error = new ValidationError('Test error');
    expect(error.stack).toBeDefined();
  });
});

describe('validateMessageContent', () => {
  it('should accept valid message content', () => {
    expect(() => validateMessageContent('Hello, World!')).not.toThrow();
    expect(() => validateMessageContent('A')).not.toThrow();
  });

  it('should reject empty message content (Requirement 5.1)', () => {
    expect(() => validateMessageContent('')).toThrow(ValidationError);
    expect(() => validateMessageContent('')).toThrow('Message content cannot be empty');
  });

  it('should accept message at 10000 character boundary (Requirement 5.3)', () => {
    const maxContent = 'a'.repeat(10000);
    expect(() => validateMessageContent(maxContent)).not.toThrow();
  });

  it('should reject message exceeding 10000 characters (Requirement 5.3)', () => {
    const tooLong = 'a'.repeat(10001);
    expect(() => validateMessageContent(tooLong)).toThrow(ValidationError);
    expect(() => validateMessageContent(tooLong)).toThrow('Message content cannot exceed 10000 characters');
  });

  it('should accept message with special characters and unicode', () => {
    const specialContent = 'Hello! 你好 🎉 @#$%^&*()';
    expect(() => validateMessageContent(specialContent)).not.toThrow();
  });
});

describe('validatePassword', () => {
  it('should accept valid passwords', () => {
    expect(() => validatePassword('test')).not.toThrow();
    expect(() => validatePassword('password123')).not.toThrow();
  });

  it('should reject empty password (Requirement 5.2)', () => {
    expect(() => validatePassword('')).toThrow(ValidationError);
    expect(() => validatePassword('')).toThrow('Password cannot be empty');
  });

  it('should accept password at 4 character minimum boundary (Requirement 5.4)', () => {
    expect(() => validatePassword('abcd')).not.toThrow();
  });

  it('should reject password below 4 characters (Requirement 5.4)', () => {
    expect(() => validatePassword('abc')).toThrow(ValidationError);
    expect(() => validatePassword('abc')).toThrow('Password must be at least 4 characters long');
  });

  it('should accept password at 128 character maximum boundary (Requirement 5.4)', () => {
    const maxPassword = 'a'.repeat(128);
    expect(() => validatePassword(maxPassword)).not.toThrow();
  });

  it('should reject password exceeding 128 characters (Requirement 5.4)', () => {
    const tooLong = 'a'.repeat(129);
    expect(() => validatePassword(tooLong)).toThrow(ValidationError);
    expect(() => validatePassword(tooLong)).toThrow('Password cannot exceed 128 characters');
  });

  it('should accept password with special characters', () => {
    expect(() => validatePassword('P@ssw0rd!')).not.toThrow();
  });
});

describe('MessageEntity interface', () => {
  it('should allow creating a valid MessageEntity object', () => {
    const message: MessageEntity = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      path: 'Kx9mP2nQ7vR4sT8w',
      content: 'This is a secret message',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz',
      createdAt: new Date(),
    };
    
    expect(message.id).toBeDefined();
    expect(message.path).toBeDefined();
    expect(message.content).toBeDefined();
    expect(message.passwordHash).toBeDefined();
    expect(message.createdAt).toBeInstanceOf(Date);
  });

  it('should allow optional expiresAt field', () => {
    const messageWithExpiry: MessageEntity = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      path: 'Kx9mP2nQ7vR4sT8w',
      content: 'This is a secret message',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
    };
    
    expect(messageWithExpiry.expiresAt).toBeInstanceOf(Date);
  });
});
