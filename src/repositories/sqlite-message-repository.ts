import { sqliteDb } from '../config/sqlite-database.js';
import { MessageEntity } from '../types/message.js';
import { MessageRepository } from './message-repository.js';
import { randomUUID } from 'crypto';

/**
 * SQLite implementation of MessageRepository
 * For local development without PostgreSQL
 */
export class SQLiteMessageRepository implements MessageRepository {
  async save(message: Omit<MessageEntity, 'id' | 'createdAt'>): Promise<MessageEntity> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    
    const sql = `
      INSERT INTO messages (id, path, content, password_hash, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      id,
      message.path,
      message.content,
      message.passwordHash,
      createdAt,
      message.expiresAt ? message.expiresAt.toISOString() : null
    ];
    
    try {
      sqliteDb.query(sql, values);
      
      // Fetch the inserted row
      const selectSql = 'SELECT * FROM messages WHERE id = ?';
      const result = sqliteDb.query(selectSql, [id]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        path: row.path,
        content: row.content,
        passwordHash: row.password_hash,
        createdAt: new Date(row.created_at),
        expiresAt: row.expires_at ? new Date(row.expires_at) : undefined
      };
    } catch (error: any) {
      // Handle unique constraint violation
      if (error.message?.includes('UNIQUE constraint failed')) {
        throw new Error(`Message with path '${message.path}' already exists`);
      }
      throw error;
    }
  }
  
  async findByPath(path: string): Promise<MessageEntity | null> {
    const sql = `
      SELECT id, path, content, password_hash, created_at, expires_at
      FROM messages
      WHERE path = ?
    `;
    
    const result = sqliteDb.query(sql, [path]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      path: row.path,
      content: row.content,
      passwordHash: row.password_hash,
      createdAt: new Date(row.created_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined
    };
  }
  
  async existsByPath(path: string): Promise<boolean> {
    const sql = `
      SELECT EXISTS(SELECT 1 FROM messages WHERE path = ?) as 'exists'
    `;
    
    const result = sqliteDb.query(sql, [path]);
    return result.rows[0].exists === 1;
  }
}

export const sqliteMessageRepository = new SQLiteMessageRepository();
