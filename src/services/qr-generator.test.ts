import { describe, it, expect } from 'vitest';
import { QRCodeGenerator } from './qr-generator';

describe('QRCodeGenerator', () => {
  const generator = new QRCodeGenerator();
  const testUrl = 'https://example.com/message/test123';

  describe('generateQRCode', () => {
    it('should generate QR code from URL successfully', async () => {
      const result = await generator.generateQRCode(testUrl);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should generate valid PNG format', async () => {
      const result = await generator.generateQRCode(testUrl);
      
      // Data URL should start with PNG data URL prefix
      expect(result).toMatch(/^data:image\/png;base64,/);
      
      // Extract base64 data and verify it's valid
      const base64Data = result.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // PNG files start with specific magic bytes: 89 50 4E 47
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50);
      expect(buffer[2]).toBe(0x4E);
      expect(buffer[3]).toBe(0x47);
    });

    it('should use default options when not specified', async () => {
      const result = await generator.generateQRCode(testUrl);
      
      expect(result).toBeDefined();
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should accept custom options', async () => {
      const result = await generator.generateQRCode(testUrl, {
        errorCorrectionLevel: 'H',
        width: 400,
        margin: 2,
      });
      
      expect(result).toBeDefined();
      expect(result).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('generateDownloadableQRCode', () => {
    it('should generate downloadable QR code with buffer', async () => {
      const result = await generator.generateDownloadableQRCode(testUrl);
      
      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('should have correct MIME type', async () => {
      const result = await generator.generateDownloadableQRCode(testUrl);
      
      expect(result.mimeType).toBe('image/png');
    });

    it('should generate timestamp-based filename when not provided', async () => {
      const result = await generator.generateDownloadableQRCode(testUrl);
      
      expect(result.filename).toMatch(/^secret-message-\d+\.png$/);
    });

    it('should use custom filename when provided', async () => {
      const customFilename = 'my-custom-qr.png';
      const result = await generator.generateDownloadableQRCode(testUrl, customFilename);
      
      expect(result.filename).toBe(customFilename);
    });

    it('should generate valid PNG buffer', async () => {
      const result = await generator.generateDownloadableQRCode(testUrl);
      
      // PNG files start with specific magic bytes: 89 50 4E 47
      expect(result.buffer[0]).toBe(0x89);
      expect(result.buffer[1]).toBe(0x50);
      expect(result.buffer[2]).toBe(0x4E);
      expect(result.buffer[3]).toBe(0x47);
    });

    it('should include timestamp in default filename', async () => {
      const beforeTimestamp = Date.now();
      const result = await generator.generateDownloadableQRCode(testUrl);
      const afterTimestamp = Date.now();
      
      // Extract timestamp from filename
      const match = result.filename.match(/^secret-message-(\d+)\.png$/);
      expect(match).not.toBeNull();
      
      if (match) {
        const timestamp = parseInt(match[1], 10);
        expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
        expect(timestamp).toBeLessThanOrEqual(afterTimestamp);
      }
    });
  });
});
