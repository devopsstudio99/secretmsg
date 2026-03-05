import { describe, it, expect } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { configureSecurity } from './security.js';

describe('Security Middleware', () => {
  describe('HTTPS Enforcement in Production', () => {
    it('should redirect HTTP to HTTPS in production', async () => {
      const app = express();
      configureSecurity(app, true);
      
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test')
        .set('Host', 'example.com');

      // Should redirect to HTTPS
      expect(response.status).toBe(301);
      expect(response.headers.location).toBe('https://example.com/test');
    });

    it('should allow HTTPS requests in production', async () => {
      const app = express();
      configureSecurity(app, true);
      
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      // Simulate HTTPS request
      const response = await request(app)
        .get('/test')
        .set('Host', 'example.com')
        .set('X-Forwarded-Proto', 'https');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should not enforce HTTPS in development', async () => {
      const app = express();
      configureSecurity(app, false);
      
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test')
        .set('Host', 'localhost');

      // Should not redirect in development
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });
  });

  describe('Security Headers', () => {
    it('should set HSTS header in production', async () => {
      const app = express();
      configureSecurity(app, true);
      
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test')
        .set('X-Forwarded-Proto', 'https');

      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
    });

    it('should set X-Frame-Options header', async () => {
      const app = express();
      configureSecurity(app, true);
      
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test')
        .set('X-Forwarded-Proto', 'https');

      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should set X-Content-Type-Options header', async () => {
      const app = express();
      configureSecurity(app, true);
      
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test')
        .set('X-Forwarded-Proto', 'https');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set Content-Security-Policy header', async () => {
      const app = express();
      configureSecurity(app, true);
      
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test')
        .set('X-Forwarded-Proto', 'https');

      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });
  });

  describe('CORS Configuration', () => {
    it('should allow all origins in development', async () => {
      const app = express();
      configureSecurity(app, false);
      
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3001');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should restrict origins in production when ALLOWED_ORIGINS is set', async () => {
      process.env.ALLOWED_ORIGINS = 'https://example.com';
      const app = express();
      configureSecurity(app, true);
      
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test')
        .set('Origin', 'https://example.com')
        .set('X-Forwarded-Proto', 'https');

      expect(response.headers['access-control-allow-origin']).toBe('https://example.com');

      delete process.env.ALLOWED_ORIGINS;
    });

    it('should block unauthorized origins in production', async () => {
      process.env.ALLOWED_ORIGINS = 'https://example.com';
      const app = express();
      configureSecurity(app, true);
      
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test')
        .set('Origin', 'https://evil.com')
        .set('X-Forwarded-Proto', 'https');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();

      delete process.env.ALLOWED_ORIGINS;
    });
  });
});
