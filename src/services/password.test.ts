import { describe, test, expect } from 'vitest';
import { PasswordService } from './password';

describe('PasswordService', () => {
  const passwordService = new PasswordService();

  describe('hashPassword', () => {
    test('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await passwordService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    test('should produce different hashes for the same password (salting)', async () => {
      const password = 'testPassword123';
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should hash passwords of different lengths', async () => {
      const shortPassword = 'test';
      const longPassword = 'a'.repeat(128);
      
      const shortHash = await passwordService.hashPassword(shortPassword);
      const longHash = await passwordService.hashPassword(longPassword);
      
      expect(shortHash).toBeDefined();
      expect(longHash).toBeDefined();
      expect(shortHash).not.toBe(longHash);
    });
  });

  describe('verifyPassword', () => {
    test('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await passwordService.hashPassword(password);
      
      const isValid = await passwordService.verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await passwordService.hashPassword(password);
      
      const isValid = await passwordService.verifyPassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });

    test('should reject password with different case', async () => {
      const password = 'testPassword123';
      const wrongCasePassword = 'TESTPASSWORD123';
      const hash = await passwordService.hashPassword(password);
      
      const isValid = await passwordService.verifyPassword(wrongCasePassword, hash);
      
      expect(isValid).toBe(false);
    });

    test('should handle empty string verification', async () => {
      const password = 'testPassword123';
      const hash = await passwordService.hashPassword(password);
      
      const isValid = await passwordService.verifyPassword('', hash);
      
      expect(isValid).toBe(false);
    });
  });
});
