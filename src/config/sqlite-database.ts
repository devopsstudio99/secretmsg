import Database from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';

/**
 * SQLite database configuration for local development and production
 */
export class SQLiteDatabase {
  private db: Database.Database;

  constructor(filename?: string) {
    // Use environment variable for production (Render persistent disk)
    // or default to local file for development
    const dbPath = process.env.SQLITE_DB_PATH || filename || 'secret_messages.db';
    
    // Ensure directory exists (important for Render persistent disk)
    const dbDir = dirname(dbPath);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    
    console.log(`SQLite database initialized at: ${dbPath}`);
    
    this.initialize();
  }

  private initialize() {
    const schema = readFileSync(join(process.cwd(), 'src/database/sqlite-schema.sql'), 'utf-8');
    this.db.exec(schema);
  }

  query(sql: string, params: any[] = []): { rows: any[] } {
    try {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = this.db.prepare(sql);
        const rows = stmt.all(...params);
        return { rows };
      } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
        const stmt = this.db.prepare(sql);
        const info = stmt.run(...params);
        
        // For INSERT RETURNING, we need to fetch the inserted row
        if (sql.toUpperCase().includes('RETURNING')) {
          const selectSql = sql.split('RETURNING')[0].replace(/INSERT INTO (\w+).*/, 'SELECT * FROM $1 WHERE rowid = ?');
          const selectStmt = this.db.prepare(selectSql);
          const rows = selectStmt.all(info.lastInsertRowid);
          return { rows };
        }
        
        return { rows: [{ lastInsertRowid: info.lastInsertRowid }] };
      } else {
        const stmt = this.db.prepare(sql);
        stmt.run(...params);
        return { rows: [] };
      }
    } catch (error) {
      throw error;
    }
  }

  close() {
    this.db.close();
  }

  getDatabase() {
    return this.db;
  }
}

export const sqliteDb = new SQLiteDatabase();
