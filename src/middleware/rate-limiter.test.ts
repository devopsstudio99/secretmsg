import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { logFailedAuthAttempt } from './rate-limiter.js';

describe('Rate Limiter Middleware', () => {
  describe('logFailedAuthAttempt', () => {
    let mockRequest: Partial<Request>;
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // Mock console.warn
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Create mock request
      mockRequest = {
        ip: '192.168.1.1',
        socket: {
          remoteAddress: '192.168.1.1'
        } as any,
        params: {
          path: 'test-path-123'
        }
      };
    });

    it('should log failed authentication attempt with IP and path', () => {
      logFailedAuthAttempt(mockRequest as Request);

      expect(consoleWarnSpy).toHaveBeenCalledOnce();
      const logMessage = consoleWarnSpy.mock.calls[0][0] as string;
      
      expect(logMessage).toContain('Failed authentication attempt');
      expect(logMessage).toContain('IP: 192.168.1.1');
      expect(logMessage).toContain('Path: test-path-123');
    });

    it('should handle missing IP address', () => {
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: undefined } as any;

      logFailedAuthAttempt(mockRequest as Request);

      expect(consoleWarnSpy).toHaveBeenCalledOnce();
      const logMessage = consoleWarnSpy.mock.calls[0][0] as string;
      
      expect(logMessage).toContain('IP: unknown');
    });

    it('should handle missing path parameter', () => {
      mockRequest.params = {};

      logFailedAuthAttempt(mockRequest as Request);

      expect(consoleWarnSpy).toHaveBeenCalledOnce();
      const logMessage = consoleWarnSpy.mock.calls[0][0] as string;
      
      expect(logMessage).toContain('Path: unknown');
    });

    it('should include timestamp in log message', () => {
      logFailedAuthAttempt(mockRequest as Request);

      expect(consoleWarnSpy).toHaveBeenCalledOnce();
      const logMessage = consoleWarnSpy.mock.calls[0][0] as string;
      
      // Check for ISO timestamp format (YYYY-MM-DDTHH:mm:ss)
      expect(logMessage).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should use socket.remoteAddress when req.ip is not available', () => {
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: '10.0.0.1' } as any;

      logFailedAuthAttempt(mockRequest as Request);

      expect(consoleWarnSpy).toHaveBeenCalledOnce();
      const logMessage = consoleWarnSpy.mock.calls[0][0] as string;
      
      expect(logMessage).toContain('IP: 10.0.0.1');
    });
  });
});
