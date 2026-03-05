import { PasswordService } from './password.js';
import { PathGeneratorService } from './path-generator.js';
import { QRCodeGenerator } from './qr-generator.js';
import { MessageRepository } from '../repositories/message-repository.js';
import { 
  validateMessageContent, 
  validatePassword, 
  ValidationError,
  AuthenticationError,
  NotFoundError 
} from '../types/message.js';

/**
 * Result of message creation
 */
export interface MessageCreationResult {
  path: string;
  url: string;
  qrCodeDataUrl: string;
}

/**
 * Message metadata without content
 */
export interface MessageMetadata {
  path: string;
  createdAt: Date;
  exists: boolean;
}

/**
 * Service for managing secret messages
 * Handles message creation, retrieval, and authentication
 */
export class MessageService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly pathGenerator: PathGeneratorService,
    private readonly qrGenerator: QRCodeGenerator,
    private readonly messageRepository: MessageRepository,
    private readonly baseUrl: string = process.env.BASE_URL || 'http://localhost:3000'
  ) {}

  /**
   * Creates a new secret message with password protection
   * @param content - The secret message content (1-10000 chars)
   * @param password - The password (4-128 chars)
   * @returns Message metadata including unique path and QR code
   * @throws ValidationError if inputs are invalid
   */
  async createMessage(content: string, password: string): Promise<MessageCreationResult> {
    // Validate inputs
    validateMessageContent(content);
    validatePassword(password);

    // Generate unique path
    const path = await this.pathGenerator.generateUniquePath();

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(password);

    // Save to repository
    await this.messageRepository.save({
      path,
      content,
      passwordHash
    });

    // Generate URL
    const url = `${this.baseUrl}/message/${path}`;

    // Generate QR code
    const qrCodeDataUrl = await this.qrGenerator.generateQRCode(url);

    return {
      path,
      url,
      qrCodeDataUrl
    };
  }

  /**
   * Retrieves message metadata without content
   * @param path - The unique message path
   * @returns Message metadata or null if not found
   */
  async getMessageMetadata(path: string): Promise<MessageMetadata | null> {
    const message = await this.messageRepository.findByPath(path);

    if (!message) {
      return null;
    }

    return {
      path: message.path,
      createdAt: message.createdAt,
      exists: true
    };
  }

  /**
   * Verifies password and retrieves message content
   * @param path - The unique message path
   * @param password - The password to verify
   * @returns Message content if password is correct
   * @throws AuthenticationError if password is incorrect
   * @throws NotFoundError if message doesn't exist
   */
  async verifyAndGetMessage(path: string, password: string): Promise<string> {
    // Retrieve message
    const message = await this.messageRepository.findByPath(path);

    if (!message) {
      throw new NotFoundError('The requested message does not exist');
    }

    // Verify password
    const isValid = await this.passwordService.verifyPassword(password, message.passwordHash);

    if (!isValid) {
      throw new AuthenticationError('Incorrect password');
    }

    return message.content;
  }
}
