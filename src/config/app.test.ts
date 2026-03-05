import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAppConfig } from './app';

describe('App Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return default configuration when env vars are not set', () => {
    delete process.env.PORT;
    delete process.env.DOMAIN_URL;
    delete process.env.BCRYPT_ROUNDS;

    const config = getAppConfig();

    expect(config.port).toBe(3000);
    expect(config.domainUrl).toBe('http://localhost:3000');
    expect(config.bcryptRounds).toBe(10);
  });

  it('should use environment variables when set', () => {
    process.env.PORT = '8080';
    process.env.DOMAIN_URL = 'https://example.com';
    process.env.BCRYPT_ROUNDS = '12';

    const config = getAppConfig();

    expect(config.port).toBe(8080);
    expect(config.domainUrl).toBe('https://example.com');
    expect(config.bcryptRounds).toBe(12);
  });
});
