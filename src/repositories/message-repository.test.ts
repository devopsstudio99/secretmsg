import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PostgresMessageRepository } from './message-repository.js';
import { pool } from '../config/database.js';

// Mock the database pool
vi.mock('../config/database.js', () => ({
  pool: {
    query: vi.fn()
  }
}));

describe('MessageRepository', () => {
  let repository: PostgresMessageRepository;

  beforeEach(() => {
    repository = new PostgresMessageRepository();
    vi.clearAllMocks();
  });

  describe('save()', () => {
    it('should persist message correctly', async () => {
      const message = {
        path: 'test-path-123',
        content: 'This is a secret message',
        passwordHash: '$2b$10$hashedpassword123'
      };

      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        path: message.path,
        content: message.content,
        passwordHash: message.passwordHash,
        createdAt: new Date(),
        expiresAt: undefined
      };

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockResult],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: []
      } as any);

      const saved = await repository.save(message);

      expect(saved.id).toBeDefined();
      expect(saved.path).toBe(message.path);
      expect(saved.content).toBe(message.content);
      expect(saved.passwordHash).toBe(message.passwordHash);
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.expiresAt).toBeUndefined();
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO messages'),
        [message.path, message.content, message.passwordHash, null]
      );
    });

    it('should save message with expiration date', async () => {
      const expiresAt = new Date(Date.now() + 86400000); // 24 hours from now
      const message = {
        path: 'test-path-456',
        content: 'Expiring message',
        passwordHash: '$2b$10$hashedpassword456',
        expiresAt
      };

      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        path: message.path,
        content: message.content,
        passwordHash: message.passwordHash,
        createdAt: new Date(),
        expiresAt: message.expiresAt
      };

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockResult],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: []
      } as any);

      const saved = await repository.save(message);

      expect(saved.expiresAt).toBeInstanceOf(Date);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO messages'),
        [message.path, message.content, message.passwordHash, message.expiresAt]
      );
    });

    it('should throw error for duplicate path', async () => {
      const message = {
        path: 'duplicate-path',
        content: 'First message',
        passwordHash: '$2b$10$hash1'
      };

      const duplicateError = new Error('duplicate key value violates unique constraint') as any;
      duplicateError.code = '23505';

      vi.mocked(pool.query).mockRejectedValueOnce(duplicateError);

      await expect(repository.save(message)).rejects.toThrow(
        "Message with path 'duplicate-path' already exists"
      );
    });
  });

  describe('findByPath()', () => {
    it('should retrieve correct message', async () => {
      const mockMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        path: 'find-test-path',
        content: 'Find me!',
        passwordHash: '$2b$10$findtest',
        createdAt: new Date(),
        expiresAt: undefined
      };

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockMessage],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      } as any);

      const found = await repository.findByPath('find-test-path');

      expect(found).not.toBeNull();
      expect(found?.path).toBe(mockMessage.path);
      expect(found?.content).toBe(mockMessage.content);
      expect(found?.passwordHash).toBe(mockMessage.passwordHash);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['find-test-path']
      );
    });

    it('should return null for non-existent path', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: []
      } as any);

      const found = await repository.findByPath('non-existent-path');

      expect(found).toBeNull();
    });

    it('should retrieve message with all fields', async () => {
      const expiresAt = new Date(Date.now() + 86400000);
      const mockMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        path: 'complete-message',
        content: 'Complete message with all fields',
        passwordHash: '$2b$10$complete',
        createdAt: new Date(),
        expiresAt
      };

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockMessage],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      } as any);

      const found = await repository.findByPath('complete-message');

      expect(found).not.toBeNull();
      expect(found?.id).toBeDefined();
      expect(found?.createdAt).toBeInstanceOf(Date);
      expect(found?.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('existsByPath()', () => {
    it('should return true for existing path', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{ exists: true }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      } as any);

      const exists = await repository.existsByPath('exists-test');

      expect(exists).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT EXISTS'),
        ['exists-test']
      );
    });

    it('should return false for non-existent path', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{ exists: false }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      } as any);

      const exists = await repository.existsByPath('does-not-exist');

      expect(exists).toBe(false);
    });

    it('should return true immediately after save', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{ exists: true }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      } as any);

      const exists = await repository.existsByPath('immediate-check');

      expect(exists).toBe(true);
    });
  });
});
