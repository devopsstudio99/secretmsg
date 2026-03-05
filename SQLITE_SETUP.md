# SQLite Setup for Local Development

This guide shows you how to run the Secret Message App locally using SQLite instead of PostgreSQL.

## Quick Start (No PostgreSQL Required!)

1. **Install dependencies:**
```bash
npm install
```

2. **The app is already configured to use SQLite!**
   - Check `.env` file - it should have `USE_SQLITE=true`
   - If not, create `.env` file:
   ```env
   USE_SQLITE=true
   BASE_URL=http://localhost:3000
   PORT=3000
   ```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
   - Go to `http://localhost:3000`
   - Create a secret message!

## How It Works

- **SQLite Database**: A file named `secret_messages.db` will be created automatically in your project root
- **No Setup Required**: The database schema is created automatically on first run
- **Same Features**: All features work exactly the same as with PostgreSQL

## Switching Between Databases

### Use SQLite (Local Development)
```env
USE_SQLITE=true
```

### Use PostgreSQL (Production)
```env
USE_SQLITE=false
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=secret_message_app
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
```

## Testing

Run all tests (they use mocks, no database needed):
```bash
npm test
```

## Database File Location

The SQLite database file is created at:
```
./secret_messages.db
```

To reset the database, simply delete this file and restart the app.

## Troubleshooting

### "Cannot find module 'better-sqlite3'"
Run: `npm install`

### Database file permissions
Make sure the project directory is writable.

### Port already in use
Change `PORT=3000` to another port in `.env` file.

## Production Deployment

For production, use PostgreSQL:
1. Set `USE_SQLITE=false` in production environment
2. Configure PostgreSQL connection details
3. Follow the main DEPLOYMENT.md guide

## Advantages of SQLite for Local Dev

✅ No database server to install or configure
✅ Zero setup - just run `npm run dev`
✅ Fast and lightweight
✅ Perfect for testing and development
✅ Database is just a file - easy to backup/reset

## Need PostgreSQL Instead?

See the main README.md for PostgreSQL setup instructions or use Docker:
```bash
docker-compose up
```
