# Deployment Guide

This guide provides detailed instructions for deploying the Secret Message App to production.

## Pre-Deployment Checklist

### 1. Environment Configuration

Create a production `.env` file with the following variables:

```env
# Database Configuration
DATABASE_HOST=your-production-db-host
DATABASE_PORT=5432
DATABASE_NAME=secret_message_app
DATABASE_USER=your-db-user
DATABASE_PASSWORD=your-secure-password

# Application Configuration
BASE_URL=https://yourdomain.com
PORT=3000
NODE_ENV=production

# Security Configuration
BCRYPT_ROUNDS=10

# CORS Configuration
# Comma-separated list of allowed origins
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 2. Database Setup

#### PostgreSQL Installation

On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

On macOS:
```bash
brew install postgresql
brew services start postgresql
```

#### Create Production Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE secret_message_app;
CREATE USER your_db_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE secret_message_app TO your_db_user;
\q
```

#### Initialize Database Schema

```bash
npm run db:init
```

### 3. Build Application

```bash
# Install production dependencies
npm ci --production=false

# Build TypeScript to JavaScript
npm run build

# Verify build output
ls -la dist/
```

### 4. Security Hardening

#### HTTPS/TLS Setup

Use a reverse proxy (nginx or Apache) to handle HTTPS:

**Nginx Configuration Example:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Firewall Configuration

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct access to application port
sudo ufw deny 3000/tcp

# Enable firewall
sudo ufw enable
```

## Deployment Methods

### Method 1: Direct Deployment (Simple)

1. Copy files to server:
```bash
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./ user@your-server:/opt/secret-message-app/
```

2. SSH into server:
```bash
ssh user@your-server
cd /opt/secret-message-app
```

3. Install dependencies and build:
```bash
npm ci --production=false
npm run build
```

4. Start application:
```bash
npm start
```

### Method 2: PM2 Process Manager (Recommended)

PM2 keeps your application running and restarts it on crashes.

1. Install PM2:
```bash
npm install -g pm2
```

2. Create PM2 ecosystem file (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'secret-message-app',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

3. Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

4. Monitor application:
```bash
pm2 status
pm2 logs secret-message-app
pm2 monit
```

### Method 3: Docker Deployment

1. Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
```

2. Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_HOST=db
      - DATABASE_PORT=5432
      - DATABASE_NAME=secret_message_app
      - DATABASE_USER=postgres
      - DATABASE_PASSWORD=${DB_PASSWORD}
      - BASE_URL=${BASE_URL}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=secret_message_app
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

3. Deploy:
```bash
docker-compose up -d
```

### Method 4: Cloud Platform Deployment

#### Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set BASE_URL=https://your-app-name.herokuapp.com

# Deploy
git push heroku main

# Initialize database
heroku run npm run db:init
```

#### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init -p node.js secret-message-app

# Create environment
eb create production-env

# Set environment variables
eb setenv NODE_ENV=production BASE_URL=https://your-domain.com

# Deploy
eb deploy
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check application health
curl https://yourdomain.com/api/messages/test

# Test message creation
curl -X POST https://yourdomain.com/api/messages \
  -H "Content-Type: application/json" \
  -d '{"content":"Test message","password":"test1234"}'
```

### 2. Monitoring Setup

#### Application Logs

```bash
# PM2 logs
pm2 logs secret-message-app --lines 100

# Docker logs
docker-compose logs -f app

# System logs
journalctl -u secret-message-app -f
```

#### Database Monitoring

```bash
# Check database connections
psql -U your_db_user -d secret_message_app -c "SELECT count(*) FROM pg_stat_activity;"

# Check table size
psql -U your_db_user -d secret_message_app -c "SELECT pg_size_pretty(pg_total_relation_size('messages'));"
```

### 3. Backup Strategy

#### Database Backups

Create automated backup script (`backup.sh`):
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/secret-message-app"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

mkdir -p $BACKUP_DIR

pg_dump -U your_db_user secret_message_app > $BACKUP_FILE
gzip $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Add to crontab:
```bash
# Run daily at 2 AM
0 2 * * * /opt/secret-message-app/backup.sh
```

### 4. Performance Optimization

#### Database Indexing

Indexes are already created by the schema, but verify:
```sql
-- Check existing indexes
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'messages';
```

#### Connection Pooling

The application uses pg Pool with default settings. For high traffic, adjust in `src/config/database.ts`:
```typescript
export const pool = new Pool({
  ...config,
  max: 20,              // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Maintenance

### Updating the Application

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm ci --production=false

# Build
npm run build

# Restart application
pm2 restart secret-message-app

# Or with Docker
docker-compose down
docker-compose up -d --build
```

### Database Migrations

For schema changes, create migration scripts in `src/database/migrations/`:

```sql
-- migrations/001_add_expiration_cleanup.sql
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM messages WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

### Cleanup Expired Messages

Add cron job for cleanup:
```bash
# Run every hour
0 * * * * psql -U your_db_user -d secret_message_app -c "DELETE FROM messages WHERE expires_at < NOW();"
```

## Troubleshooting

### Application Won't Start

1. Check logs: `pm2 logs secret-message-app`
2. Verify environment variables: `pm2 env 0`
3. Test database connection: `psql -U your_db_user -d secret_message_app -c "SELECT 1;"`
4. Check port availability: `netstat -tulpn | grep 3000`

### High Memory Usage

```bash
# Check memory usage
pm2 monit

# Restart application
pm2 restart secret-message-app

# Adjust PM2 max memory restart
pm2 start ecosystem.config.js --max-memory-restart 500M
```

### Database Connection Pool Exhausted

Increase pool size in `src/config/database.ts` or check for connection leaks.

## Security Maintenance

### Regular Updates

```bash
# Check for security vulnerabilities
npm audit

# Update dependencies
npm update

# Update critical security patches
npm audit fix
```

### SSL Certificate Renewal (Let's Encrypt)

```bash
# Renew certificates
sudo certbot renew

# Reload nginx
sudo systemctl reload nginx
```

### Monitor Failed Login Attempts

```bash
# Check rate limiting logs
grep "Too many requests" /var/log/nginx/access.log | tail -20
```

## Support

For issues or questions:
- Check application logs
- Review error messages in browser console
- Verify environment configuration
- Check database connectivity
- Review security headers and CORS settings
