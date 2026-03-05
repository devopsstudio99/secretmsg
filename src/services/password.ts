import bcrypt from 'bcrypt';

/**
 * Service for password hashing and verification
 * Implements secure password handling with bcrypt
 */
export class PasswordService {
  private readonly saltRounds = 10;

  /**
   * Hashes a password with a cryptographically secure salt
   * @param password - Plain text password
   * @returns Hashed password with salt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verifies a password against a hash using constant-time comparison
   * @param password - Plain text password to verify
   * @param hash - Stored password hash
   * @returns True if password matches
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
