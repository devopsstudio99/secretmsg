import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PathGeneratorService } from './path-generator';
import { pool } from '../config/database.js';

// Mock the database pool
vi.mock('../config/database.js', () => ({
  pool: {
    query: vi.fn()
  }
}));

describe('PathGeneratorService', () => {
  let service: PathGeneratorService;

  beforeEach(() => {
    service = new PathGeneratorService();
    vi.clearAllMocks();
  });

  describe('generatePath', () => {
    it('should generate a path with minimum length of 22 characters', () => {
      // 16 bytes base64url encoded = 22 characters (without padding)
      const path = service.generatePath();
      expect(path.length).toBeGreaterThanOrEqual(22);
    });

    it('should generate paths using only URL-safe characters', () => {
      const path = service.generatePath();
      // URL-safe base64: A-Z, a-z, 0-9, -, _
      const urlSafePattern = /^[A-Za-z0-9\-_]+$/;
      expect(path).toMatch(urlSafePattern);
    });

    it('should not contain padding characters', () => {
      const path = service.generatePath();
      expect(path).not.toContain('=');
    });

    it('should not contain + or / characters', () => {
      const path = service.generatePath();
      expect(path).not.toContain('+');
      expect(path).not.toContain('/');
    });

    it('should generate different paths on subsequent calls', () => {
      const path1 = service.generatePath();
      const path2 = service.generatePath();
      const path3 = service.generatePath();
      
      expect(path1).not.toBe(path2);
      expect(path2).not.toBe(path3);
      expect(path1).not.toBe(path3);
    });

    it('should generate paths with high entropy (statistical test)', () => {
      // Generate multiple paths and check for uniqueness
      const paths = new Set<string>();
      const count = 100;
      
      for (let i = 0; i < count; i++) {
        paths.add(service.generatePath());
      }
      
      // All paths should be unique
      expect(paths.size).toBe(count);
    });
  });

  describe('pathExists', () => {
    it('should return true when path exists in database', async () => {
      const mockPath = 'test-path-123';
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{ exists: true }],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: []
      } as any);

      const exists = await service.pathExists(mockPath);
      
      expect(exists).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT EXISTS(SELECT 1 FROM messages WHERE path = $1) as exists',
        [mockPath]
      );
    });

    it('should return false when path does not exist in database', async () => {
      const mockPath = 'non-existent-path';
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{ exists: false }],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: []
      } as any);

      const exists = await service.pathExists(mockPath);
      
      expect(exists).toBe(false);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT EXISTS(SELECT 1 FROM messages WHERE path = $1) as exists',
        [mockPath]
      );
    });
  });

  describe('generateUniquePath', () => {
    it('should return a path on first attempt if unique', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{ exists: false }],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: []
      } as any);

      const path = await service.generateUniquePath();
      
      expect(path).toBeDefined();
      expect(path.length).toBeGreaterThanOrEqual(22);
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('should retry on collision and return unique path', async () => {
      // First call: path exists (collision)
      // Second call: path doesn't exist (success)
      vi.mocked(pool.query)
        .mockResolvedValueOnce({
          rows: [{ exists: true }],
          command: '',
          rowCount: 1,
          oid: 0,
          fields: []
        } as any)
        .mockResolvedValueOnce({
          rows: [{ exists: false }],
          command: '',
          rowCount: 1,
          oid: 0,
          fields: []
        } as any);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const path = await service.generateUniquePath();
      
      expect(path).toBeDefined();
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Path collision detected on attempt 1')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should throw error after max retries (3 attempts)', async () => {
      // All three attempts return collision
      vi.mocked(pool.query)
        .mockResolvedValue({
          rows: [{ exists: true }],
          command: '',
          rowCount: 1,
          oid: 0,
          fields: []
        } as any);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(service.generateUniquePath()).rejects.toThrow(
        'Failed to generate unique path after 3 attempts'
      );
      
      expect(pool.query).toHaveBeenCalledTimes(3);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(3);

      consoleWarnSpy.mockRestore();
    });

    it('should succeed on third attempt after two collisions', async () => {
      // First two calls: collision, third call: success
      vi.mocked(pool.query)
        .mockResolvedValueOnce({
          rows: [{ exists: true }],
          command: '',
          rowCount: 1,
          oid: 0,
          fields: []
        } as any)
        .mockResolvedValueOnce({
          rows: [{ exists: true }],
          command: '',
          rowCount: 1,
          oid: 0,
          fields: []
        } as any)
        .mockResolvedValueOnce({
          rows: [{ exists: false }],
          command: '',
          rowCount: 1,
          oid: 0,
          fields: []
        } as any);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const path = await service.generateUniquePath();
      
      expect(path).toBeDefined();
      expect(pool.query).toHaveBeenCalledTimes(3);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);

      consoleWarnSpy.mockRestore();
    });
  });
});
