# Deploy Secret Message App to Render

This guide walks you through deploying the Secret Message App to Render with a PostgreSQL database.

## Prerequisites

- A [Render account](https://render.com) (free tier available)
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### Step 1: Create a PostgreSQL Database

1. Log in to your [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **PostgreSQL**
3. Configure your database:
   - **Name**: `secret-message-db` (or your preferred name)
   - **Database**: `secret_message_app`
   - **User**: `secret_message_user` (auto-generated)
   - **Region**: Choose closest to your users
   - **Plan**: Free (or paid for production)
4. Click **Create Database**
5. Wait for the database to provision (1-2 minutes)
6. **Important**: Copy the **Internal Database URL** from the database dashboard (you'll need this)

### Step 2: Initialize Database Schema

After your database is created, you need to run the schema initialization:

1. In your Render database dashboard, click **Connect** → **External Connection**
2. Copy the **PSQL Command** (looks like: `PGPASSWORD=xxx psql -h xxx.render.com -U secret_message_user secret_message_app`)
3. Run this command in your local terminal
4. Once connected, copy and paste the contents of `src/database/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    path VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accessed_at TIMESTAMP
);

CREATE INDEX idx_messages_path ON messages(path);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

5. Type `\q` to exit psql

### Step 3: Create a Web Service

1. In Render Dashboard, click **New +** → **Web Service**
2. Connect your Git repository:
   - Click **Connect** next to your repository
   - If not listed, click **Configure account** to grant access
3. Configure your web service:
   - **Name**: `secret-message-app` (this becomes your URL)
   - **Region**: Same as your database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave blank
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for production)

### Step 4: Configure Environment Variables

In the **Environment Variables** section, add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `DATABASE_URL` | *Internal Database URL from Step 1* | Use Internal URL for better performance |
| `BASE_URL` | `https://secret-message-app.onrender.com` | Replace with your actual Render URL |
| `PORT` | `3000` | Render will override this automatically |
| `USE_SQLITE` | `false` | Use PostgreSQL on Render |

**To get your DATABASE_URL:**
1. Go to your PostgreSQL database in Render Dashboard
2. Copy the **Internal Database URL** (starts with `postgresql://`)
3. Paste it as the `DATABASE_URL` value

**Important**: Use the **Internal Database URL** (not External) for better performance and security.

### Step 5: Deploy

1. Click **Create Web Service**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build your TypeScript code
   - Start your application
3. Watch the deployment logs for any errors
4. Once deployed, your app will be available at: `https://your-app-name.onrender.com`

### Step 6: Update Database Configuration (Optional)

If you want to use individual database connection parameters instead of `DATABASE_URL`, add these environment variables:

| Key | Value |
|-----|-------|
| `DATABASE_HOST` | From Render database dashboard |
| `DATABASE_PORT` | `5432` |
| `DATABASE_NAME` | `secret_message_app` |
| `DATABASE_USER` | From Render database dashboard |
| `DATABASE_PASSWORD` | From Render database dashboard |

**Note**: If `DATABASE_URL` is set, it takes precedence over individual parameters.

## Verify Deployment

1. Visit your app URL: `https://your-app-name.onrender.com`
2. Create a test message
3. Verify you can access it with the password
4. Check the Render logs for any errors

## Custom Domain (Optional)

To use your own domain:

1. In your web service dashboard, go to **Settings** → **Custom Domain**
2. Click **Add Custom Domain**
3. Enter your domain (e.g., `secrets.yourdomain.com`)
4. Add the provided CNAME record to your DNS provider
5. Wait for DNS propagation (5-60 minutes)
6. Update `BASE_URL` environment variable to your custom domain

## Troubleshooting

### Database Connection Errors

**Error**: "Failed to connect to database"

**Solutions**:
- Verify `DATABASE_URL` is set correctly (use Internal URL)
- Check database is running in Render dashboard
- Ensure database and web service are in the same region
- Verify database schema was initialized (Step 2)

### Build Failures

**Error**: "Build failed" or "TypeScript errors"

**Solutions**:
- Check build logs in Render dashboard
- Verify `package.json` has correct build script
- Ensure all dependencies are in `dependencies` (not `devDependencies`)
- Try building locally: `npm run build`

### App Crashes on Startup

**Error**: "Service exited with code 1"

**Solutions**:
- Check logs for specific error messages
- Verify `NODE_ENV=production` is set
- Ensure `USE_SQLITE=false` (SQLite won't work on Render)
- Check that database schema is initialized

### Slow First Load

**Issue**: App takes 30+ seconds to load initially

**Explanation**: Render's free tier spins down after 15 minutes of inactivity. First request wakes it up.

**Solutions**:
- Upgrade to paid plan for always-on service
- Use a service like [UptimeRobot](https://uptimerobot.com) to ping your app every 5 minutes
- Accept the cold start delay on free tier

## Performance Optimization

### Enable HTTP/2
Render automatically enables HTTP/2 for all services.

### Add Health Check Endpoint

Add this to your `src/index.ts`:

```typescript
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});
```

Then configure in Render:
- **Settings** → **Health Check Path**: `/health`

### Database Connection Pooling

Your app already uses connection pooling via `pg` package. For production, consider adjusting pool size in `src/config/database.ts`:

```typescript
max: 20, // Maximum pool size
idleTimeoutMillis: 30000,
connectionTimeoutMillis: 2000,
```

## Monitoring

### View Logs
- Go to your web service dashboard
- Click **Logs** tab
- View real-time application logs

### Metrics
- **Metrics** tab shows:
  - CPU usage
  - Memory usage
  - Request count
  - Response times

### Alerts
Set up email alerts:
- **Settings** → **Notifications**
- Enable alerts for:
  - Deploy failures
  - Service crashes
  - High resource usage

## Backup Strategy

### Database Backups

Render automatically backs up PostgreSQL databases:
- **Free tier**: Daily backups, 7-day retention
- **Paid tiers**: More frequent backups, longer retention

To manually backup:
1. Go to database dashboard
2. Click **Backups** tab
3. Click **Create Backup**

To restore:
1. Click on a backup
2. Click **Restore**
3. Confirm restoration

## Scaling

### Vertical Scaling (More Resources)
1. Go to web service **Settings**
2. Change **Instance Type** to a larger plan
3. Click **Save Changes**

### Horizontal Scaling (More Instances)
Available on paid plans:
1. **Settings** → **Scaling**
2. Increase **Number of Instances**
3. Render automatically load balances

## Cost Estimates

### Free Tier
- Web Service: Free (spins down after 15 min inactivity)
- PostgreSQL: Free (90-day expiration, 1GB storage)
- **Total**: $0/month

### Production Tier
- Web Service: $7/month (always-on, 512MB RAM)
- PostgreSQL: $7/month (no expiration, 1GB storage)
- **Total**: $14/month

## Security Checklist

- [x] HTTPS enabled automatically by Render
- [x] Environment variables encrypted at rest
- [x] Database uses internal networking
- [x] Rate limiting configured in app
- [x] Security headers via Helmet middleware
- [ ] Set up custom domain with your SSL certificate
- [ ] Enable Render's DDoS protection (paid plans)
- [ ] Regular database backups verified
- [ ] Monitor logs for suspicious activity

## Continuous Deployment

Render automatically deploys when you push to your connected branch:

1. Make changes to your code
2. Commit and push to GitHub/GitLab
3. Render detects the push
4. Automatically builds and deploys
5. Zero-downtime deployment

To disable auto-deploy:
- **Settings** → **Build & Deploy**
- Toggle **Auto-Deploy** off

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community Forum](https://community.render.com)
- [Render Status Page](https://status.render.com)

## Next Steps

After successful deployment:

1. Test all functionality thoroughly
2. Set up monitoring and alerts
3. Configure custom domain (optional)
4. Set up regular database backups
5. Monitor performance and costs
6. Consider upgrading to paid tier for production use

---

**Your app is now live!** 🎉

Visit `https://your-app-name.onrender.com` to start sharing secret messages securely.
