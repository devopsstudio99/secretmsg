import { randomBytes } from 'crypto';
import { sqliteDb } from '../config/sqlite-database.js';

/**
 * SQLite version of PathGeneratorService
 * Uses SQLite database for path existence checks
 */
export class SQLitePathGeneratorService {
  private readonly pathLength = 16; // 16 bytes = 128 bits of entropy
  private readonly maxRetries = 3;

  /**
   * Generates a cryptographically secure random URL path
   * Uses crypto.randomBytes with base64url encoding
   * @returns URL-safe random string with at least 16 characters of entropy
   */
  generatePath(): string {
    // Generate 16 bytes of random data (128 bits of entropy)
    const buffer = randomBytes(this.pathLength);
    
    // Convert to base64url encoding (URL-safe, no padding)
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Checks if a path already exists in storage
   * @param path - The path to check
   * @returns True if path exists
   */
  async pathExists(path: string): Promise<boolean> {
    const result = sqliteDb.query(
      "SELECT EXISTS(SELECT 1 FROM messages WHERE path = ?) as 'exists'",
      [path]
    );
    return result.rows[0].exists === 1;
  }

  /**
   * Generates a unique path that doesn't exist in storage
   * Implements retry logic with maximum 3 attempts
   * @returns Unique URL-safe random string
   * @throws Error if unable to generate unique path after max retries
   */
  async generateUniquePath(): Promise<string> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const path = this.generatePath();
      const exists = await this.pathExists(path);
      
      if (!exists) {
        return path;
      }
      
      // Log collision for monitoring (extremely rare)
      console.warn(`Path collision detected on attempt ${attempt + 1}: ${path}`);
    }
    
    throw new Error(`Failed to generate unique path after ${this.maxRetries} attempts`);
  }
}
