import pg from 'pg';

const { Pool } = pg;

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export function getDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    database: process.env.DATABASE_NAME || 'secret_message_app',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || ''
  };
}

export function createDatabasePool(): pg.Pool {
  // Render and other platforms provide DATABASE_URL
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  
  // Fallback to individual connection parameters
  const config = getDatabaseConfig();
  return new Pool(config);
}

export const pool = createDatabasePool();
