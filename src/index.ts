import dotenv from 'dotenv';
import express from 'express';
import { MessageService } from './services/message-service.js';
import { PasswordService } from './services/password.js';
import { PathGeneratorService } from './services/path-generator.js';
import { QRCodeGenerator } from './services/qr-generator.js';
import { PostgresMessageRepository } from './repositories/message-repository.js';
import { SQLiteMessageRepository } from './repositories/sqlite-message-repository.js';
import { SQLitePathGeneratorService } from './services/sqlite-path-generator.js';
import { createMessagesRouter } from './routes/messages.js';
import { errorHandler } from './middleware/error-handler.js';
import { configureSecurity } from './middleware/security.js';
import { pool } from './config/database.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Determine if running in production
const isProduction = process.env.NODE_ENV === 'production';

// Determine database type (SQLite for local dev, PostgreSQL for production)
const useSQLite = process.env.USE_SQLITE === 'true' || (!isProduction && !process.env.DATABASE_HOST);

// Configure security headers and HTTPS (must be first)
configureSecurity(app, isProduction);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve message.html for message access URLs
app.get('/message/:path', (_req, res) => {
  res.sendFile('message.html', { root: 'public' });
});

// Initialize services based on database type
const passwordService = new PasswordService();
const pathGenerator = useSQLite ? new SQLitePathGeneratorService() : new PathGeneratorService();
const qrGenerator = new QRCodeGenerator();
const messageRepository = useSQLite ? new SQLiteMessageRepository() : new PostgresMessageRepository();
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const messageService = new MessageService(
  passwordService,
  pathGenerator,
  qrGenerator,
  messageRepository,
  baseUrl
);

console.log(`Using database: ${useSQLite ? 'SQLite (local)' : 'PostgreSQL'}`);

// Routes
app.use('/api/messages', createMessagesRouter(messageService));

// Error handling middleware (must be last)
app.use(errorHandler);

// Verify database connection
async function verifyDatabaseConnection(): Promise<void> {
  if (useSQLite) {
    console.log('SQLite database initialized');
    return;
  }
  
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL database connection verified');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL database:', error);
    console.error('Tip: Set USE_SQLITE=true in .env to use SQLite for local development');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server gracefully...');
  if (!useSQLite) {
    await pool.end();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server gracefully...');
  if (!useSQLite) {
    await pool.end();
  }
  process.exit(0);
});

// Start server
const PORT = parseInt(process.env.PORT || '3000');

verifyDatabaseConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`Secret Message App running on port ${PORT}`);
    console.log(`Base URL: ${baseUrl}`);
    console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
  });
});

export { app };
