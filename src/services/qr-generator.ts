import QRCode from 'qrcode';

/**
 * Options for QR code generation
 */
export interface QRCodeOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  width?: number;
  margin?: number;
}

/**
 * Represents a downloadable QR code file
 */
export interface QRCodeFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

/**
 * Service for generating QR codes from URLs
 */
export class QRCodeGenerator {
  /**
   * Generates a QR code image from a URL
   * @param url - The URL to encode
   * @param options - QR code generation options
   * @returns QR code as data URL (PNG format)
   */
  async generateQRCode(url: string, options?: QRCodeOptions): Promise<string> {
    const qrOptions = {
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
      width: options?.width || 300,
      margin: options?.margin || 4,
    };

    return await QRCode.toDataURL(url, qrOptions);
  }

  /**
   * Generates a downloadable QR code file
   * @param url - The URL to encode
   * @param filename - Optional filename (defaults to timestamp-based name)
   * @returns QR code as buffer with filename
   */
  async generateDownloadableQRCode(url: string, filename?: string): Promise<QRCodeFile> {
    const qrOptions = {
      errorCorrectionLevel: 'M' as const,
      width: 300,
      margin: 4,
    };

    const buffer = await QRCode.toBuffer(url, qrOptions);
    
    const finalFilename = filename || `secret-message-${Date.now()}.png`;

    return {
      buffer,
      filename: finalFilename,
      mimeType: 'image/png',
    };
  }
}
