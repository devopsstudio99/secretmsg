# Quick Start Guide - Secret Message App

## ✨ Run Locally in 3 Steps (No Database Installation!)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the App
```bash
npm run dev
```

### Step 3: Open Your Browser
Go to: **http://localhost:3000**

That's it! 🎉

## What Just Happened?

- ✅ The app is using **SQLite** (a file-based database)
- ✅ Database file created automatically: `secret_messages.db`
- ✅ No PostgreSQL installation needed
- ✅ All features work perfectly

## Try It Out

1. **Create a Secret Message:**
   - Go to http://localhost:3000
   - Enter your message and password
   - Get a unique URL and QR code

2. **View the Message:**
   - Click the generated URL
   - Enter the password
   - See your secret message!

## Configuration

The app uses `.env` file for configuration. Default settings:

```env
USE_SQLITE=true              # Use SQLite (no PostgreSQL needed)
BASE_URL=http://localhost:3000
PORT=3000
NODE_ENV=development
```

## Running Tests

All tests work without any database:

```bash
npm test
```

Tests use mocks, so they run instantly!

## Database Options

### SQLite (Current - Default)
- ✅ Zero setup
- ✅ Perfect for local development
- ✅ Just a file - easy to reset
- ✅ No server to install

**To use:** Set `USE_SQLITE=true` in `.env` (already set!)

### PostgreSQL (Production)
- For production deployments
- More scalable for high traffic

**To switch:** 
1. Set `USE_SQLITE=false` in `.env`
2. Configure PostgreSQL connection details
3. See README.md for full setup

### Docker (Both App + Database)
```bash
docker-compose up
```

## Common Commands

```bash
# Start development server
npm run dev

# Run all tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

## Resetting the Database

Simply delete the database file:

```bash
# Windows
del secret_messages.db

# Mac/Linux
rm secret_messages.db
```

The file will be recreated automatically when you restart the app.

## Troubleshooting

### Port 3000 already in use?
Change the port in `.env`:
```env
PORT=3001
```

### "Cannot find module 'better-sqlite3'"?
Run:
```bash
npm install
```

### Want to use PostgreSQL instead?
See the main README.md or DEPLOYMENT.md

## Next Steps

- 📖 Read [README.md](README.md) for full documentation
- 🚀 See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- 🔒 Check [docs/SECURITY.md](docs/SECURITY.md) for security features
- 💾 See [SQLITE_SETUP.md](SQLITE_SETUP.md) for SQLite details

## Features

- 🔐 Password-protected messages
- 🔗 Cryptographically secure URLs (128-bit entropy)
- 📱 QR code generation
- 🛡️ Rate limiting (5 attempts/minute)
- 🔒 Security headers (HSTS, CSP, etc.)
- ✅ Input validation
- 🧪 137 passing tests

## Support

Having issues? Check:
1. Is the dev server running? (`npm run dev`)
2. Is port 3000 available?
3. Did you run `npm install`?
4. Check the terminal for error messages

Enjoy building with Secret Message App! 🚀
