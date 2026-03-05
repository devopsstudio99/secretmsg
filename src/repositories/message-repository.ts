import { pool } from '../config/database.js';
import { MessageEntity } from '../types/message.js';

/**
 * Message Repository Interface
 * Handles database operations for messages
 */
export interface MessageRepository {
  /**
   * Stores a new message with hashed password
   * @param message - Message data to store
   * @returns The stored message with generated ID
   */
  save(message: Omit<MessageEntity, 'id' | 'createdAt'>): Promise<MessageEntity>;
  
  /**
   * Retrieves a message by its unique path
   * @param path - The unique message path
   * @returns Message entity or null if not found
   */
  findByPath(path: string): Promise<MessageEntity | null>;
  
  /**
   * Checks if a path exists
   * @param path - The path to check
   * @returns True if path exists
   */
  existsByPath(path: string): Promise<boolean>;
}

/**
 * PostgreSQL implementation of MessageRepository
 */
export class PostgresMessageRepository implements MessageRepository {
  async save(message: Omit<MessageEntity, 'id' | 'createdAt'>): Promise<MessageEntity> {
    const query = `
      INSERT INTO messages (path, content, password_hash, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, path, content, password_hash as "passwordHash", created_at as "createdAt", expires_at as "expiresAt"
    `;
    
    const values = [
      message.path,
      message.content,
      message.passwordHash,
      message.expiresAt || null
    ];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      // Handle unique constraint violation
      if ((error as any).code === '23505') {
        throw new Error(`Message with path '${message.path}' already exists`);
      }
      throw error;
    }
  }
  
  async findByPath(path: string): Promise<MessageEntity | null> {
    const query = `
      SELECT 
        id, 
        path, 
        content, 
        password_hash as "passwordHash", 
        created_at as "createdAt", 
        expires_at as "expiresAt"
      FROM messages
      WHERE path = $1
    `;
    
    const result = await pool.query(query, [path]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }
  
  async existsByPath(path: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(SELECT 1 FROM messages WHERE path = $1) as exists
    `;
    
    const result = await pool.query(query, [path]);
    return result.rows[0].exists;
  }
}

/**
 * Default repository instance
 */
export const messageRepository = new PostgresMessageRepository();
