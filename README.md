# Secret Message App

A secure secret message sharing application with password protection. Users can create password-protected messages and share them via unique URLs and QR codes.

## Features

- 🔒 Password-protected secret messages
- 🔗 Unique, cryptographically secure URLs
- 📱 QR code generation for easy sharing
- 🛡️ Security-first design with bcrypt password hashing
- ⚡ Rate limiting to prevent brute force attacks
- 🌐 Production-ready with HTTPS and security headers

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## Installation

### Option 1: SQLite (Easiest - No Database Setup!)

Perfect for local development and testing:

1. Clone the repository:
```bash
git clone <repository-url>
cd secret-message-app
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

The default `.env` is already configured for SQLite:
```env
USE_SQLITE=true
BASE_URL=http://localhost:3000
PORT=3000
```

4. Start the development server:
```bash
npm run dev
```

That's it! The app will be available at `http://localhost:3000`

The SQLite database file (`secret_messages.db`) will be created automatically.

### Option 2: PostgreSQL (Production-Ready)

For production or if you prefer PostgreSQL:

1. Clone the repository:
```bash
git clone <repository-url>
cd secret-message-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=secret_message_app
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password_here

# Application Configuration
BASE_URL=http://localhost:3000
PORT=3000
NODE_ENV=development
```

4. Create the database:
```bash
createdb secret_message_app
```

5. Initialize the database schema:
```bash
npm run db:init
```

## Development

Start the development server with hot reload:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Production Deployment

### 1. Build the application:
```bash
npm run build
```

### 2. Configure production environment variables:

Create a `.env` file with production settings:
```env
# Database Configuration
DATABASE_HOST=your-db-host
DATABASE_PORT=5432
DATABASE_NAME=secret_message_app
DATABASE_USER=your-db-user
DATABASE_PASSWORD=your-secure-password

# Application Configuration
BASE_URL=https://yourdomain.com
PORT=3000
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com
```

### 3. Initialize the production database:
```bash
npm run db:init
```

### 4. Start the production server:
```bash
npm start
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `BASE_URL` with your domain (HTTPS)
- [ ] Set strong `DATABASE_PASSWORD`
- [ ] Configure `ALLOWED_ORIGINS` for CORS
- [ ] Ensure PostgreSQL is running and accessible
- [ ] Run database migrations (`npm run db:init`)
- [ ] Set up HTTPS/TLS (use reverse proxy like nginx)
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for database

## Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run property-based tests only:
```bash
npm run test:property
```

## API Endpoints

### Create Message
```
POST /api/messages
Content-Type: application/json

{
  "content": "Your secret message",
  "password": "your-password"
}

Response: 201 Created
{
  "path": "Kx9mP2nQ7vR4sT8w",
  "url": "https://yourdomain.com/message/Kx9mP2nQ7vR4sT8w",
  "qrCodeDataUrl": "data:image/png;base64,..."
}
```

### Get Message Metadata
```
GET /api/messages/:path

Response: 200 OK
{
  "path": "Kx9mP2nQ7vR4sT8w",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "exists": true
}
```

### Verify Password and Get Message
```
POST /api/messages/:path/verify
Content-Type: application/json

{
  "password": "your-password"
}

Response: 200 OK
{
  "content": "Your secret message"
}
```

## Security Features

- **Password Hashing**: Bcrypt with salt (cost factor 10)
- **Cryptographically Secure URLs**: 128 bits of entropy
- **Rate Limiting**: 5 password attempts per minute per IP
- **Security Headers**: HSTS, CSP, X-Frame-Options via Helmet
- **HTTPS Enforcement**: In production mode
- **Timing Attack Protection**: Constant-time password comparison
- **Input Validation**: Message (1-10000 chars), Password (4-128 chars)

## Architecture

```
Client Layer (HTML/JS)
    ↓
API Endpoints (Express)
    ↓
Business Logic (Services)
    ↓
Data Access (Repository)
    ↓
Database (PostgreSQL)
```

## Project Structure

```
secret-message-app/
├── src/
│   ├── config/          # Configuration files
│   ├── database/        # Database schema and initialization
│   ├── middleware/      # Express middleware
│   ├── repositories/    # Data access layer
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Application entry point
├── public/              # Static client files
│   ├── index.html       # Message creation page
│   ├── message.html     # Message access page
│   ├── app.js           # Client-side logic for creation
│   ├── message.js       # Client-side logic for access
│   └── styles.css       # Styling
├── dist/                # Compiled JavaScript (generated)
└── package.json
```

## Troubleshooting

### Database Connection Issues

If you see "Failed to connect to database":
1. Ensure PostgreSQL is running: `pg_isready`
2. Verify database exists: `psql -l | grep secret_message_app`
3. Check credentials in `.env` file
4. Verify network connectivity to database host

### Port Already in Use

If port 3000 is already in use:
1. Change `PORT` in `.env` file
2. Or stop the process using port 3000

### HTTPS Warnings in Production

In production, ensure:
1. `NODE_ENV=production` is set
2. Use a reverse proxy (nginx/Apache) for HTTPS termination
3. Configure `BASE_URL` with `https://` protocol

## License

MIT
