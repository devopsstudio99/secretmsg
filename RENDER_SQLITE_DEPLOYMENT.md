# Deploy Secret Message App to Render with SQLite

This guide walks you through deploying the Secret Message App to Render using SQLite with persistent disk storage.

## Important: SQLite on Render Requires Paid Plan

⚠️ **SQLite requires persistent disk storage, which is only available on Render's paid plans ($7/month minimum).**

The free tier uses ephemeral storage that resets on every deploy, so your database would be lost.

## Prerequisites

- A [Render account](https://render.com)
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- A paid Render plan ($7/month for Starter)

## Deployment Steps

### Step 1: Create a Web Service

1. Log in to your [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your Git repository:
   - Click **Connect** next to your repository
   - If not listed, click **Configure account** to grant access
4. Configure your web service:
   - **Name**: `secret-message-app` (this becomes your URL)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave blank
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Select **Starter** or higher ($7/month minimum)

### Step 2: Add Persistent Disk

This is crucial for SQLite to persist data across deploys:

1. In your web service configuration, scroll to **Disks**
2. Click **Add Disk**
3. Configure the disk:
   - **Name**: `sqlite-data`
   - **Mount Path**: `/data`
   - **Size**: 1 GB (minimum, adjust as needed)
4. Click **Save**

### Step 3: Configure Environment Variables

In the **Environment Variables** section, add these:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `USE_SQLITE` | `true` | Enable SQLite mode |
| `SQLITE_DB_PATH` | `/data/secret_messages.db` | Path to persistent disk |
| `BASE_URL` | `https://secret-message-app.onrender.com` | Replace with your actual Render URL |
| `PORT` | `3000` | Render will override this automatically |

### Step 4: Update SQLite Configuration

You need to modify your app to use the persistent disk path. Update `src/config/sqlite-database.ts`:

```typescript
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use environment variable for database path (for Render persistent disk)
const dbPath = process.env.SQLITE_DB_PATH || join(__dirname, '../../secret_messages.db');

// Ensure directory exists
const dbDir = dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Initialize schema
const schema = `
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accessed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_messages_path ON messages(path);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
`;

db.exec(schema);

console.log(\`SQLite database initialized at: \${dbPath}\`);
```

### Step 5: Deploy

1. Commit and push the configuration changes to your repository
2. Click **Create Web Service** in Render
3. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build your TypeScript code
   - Create the persistent disk
   - Start your application
4. Watch the deployment logs for any errors
5. Once deployed, your app will be available at: `https://your-app-name.onrender.com`

## Verify Deployment

1. Visit your app URL: `https://your-app-name.onrender.com`
2. Create a test message
3. Verify you can access it with the password
4. Check the Render logs - you should see: `SQLite database initialized at: /data/secret_messages.db`
5. Deploy again (push a small change) and verify your test message still exists

## Custom Domain (Optional)

To use your own domain:

1. In your web service dashboard, go to **Settings** → **Custom Domain**
2. Click **Add Custom Domain**
3. Enter your domain (e.g., `secrets.yourdomain.com`)
4. Add the provided CNAME record to your DNS provider
5. Wait for DNS propagation (5-60 minutes)
6. Update `BASE_URL` environment variable to your custom domain

## Troubleshooting

### Database File Not Found

**Error**: "SQLITE_CANTOPEN: unable to open database file"

**Solutions**:
- Verify persistent disk is mounted at `/data`
- Check `SQLITE_DB_PATH=/data/secret_messages.db` is set
- Ensure you're on a paid plan (free tier doesn't support disks)
- Check logs for disk mount errors

### Database Resets on Deploy

**Issue**: Messages disappear after redeployment

**Solutions**:
- Verify persistent disk is properly configured
- Check disk is mounted to `/data` (not `/opt/render/project/data`)
- Ensure `SQLITE_DB_PATH` points to `/data/secret_messages.db`
- Confirm you're on a paid plan

### Permission Errors

**Error**: "EACCES: permission denied"

**Solutions**:
- Render automatically handles permissions for `/data`
- Don't try to write to `/opt/render/project` (read-only)
- Verify `SQLITE_DB_PATH` is set to `/data/secret_messages.db`

### Build Failures

**Error**: "Build failed" or "TypeScript errors"

**Solutions**:
- Check build logs in Render dashboard
- Verify `package.json` has correct build script
- Ensure `better-sqlite3` is in `dependencies` (not `devDependencies`)
- Try building locally: `npm run build`

### Slow First Load

**Issue**: App takes time to load initially

**Explanation**: Even on paid plans, there may be a brief startup time.

**Solutions**:
- This is normal for Node.js apps
- Consider adding a health check endpoint
- Use a CDN for static assets

## Performance Optimization

### Add Health Check Endpoint

Add this to your `src/index.ts`:

```typescript
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});
```

Then configure in Render:
- **Settings** → **Health Check Path**: `/health`

### SQLite Performance Tips

SQLite is already optimized in your app, but for high traffic:

1. **Enable WAL mode** (already done in your app)
2. **Connection pooling** (not needed for SQLite)
3. **Regular VACUUM** to optimize database:

```typescript
// Add to your app startup
db.exec('PRAGMA optimize;');
```

### Backup Strategy

Since SQLite is a single file, backups are simple:

**Option 1: Manual Backup via SSH**
1. Go to web service **Shell** tab
2. Run: `cp /data/secret_messages.db /data/backup-$(date +%Y%m%d).db`

**Option 2: Automated Backup Script**

Create a backup endpoint (protect with authentication!):

```typescript
app.post('/admin/backup', async (req, res) => {
  // Add authentication here!
  const backupPath = `/data/backup-${Date.now()}.db`;
  fs.copyFileSync(process.env.SQLITE_DB_PATH!, backupPath);
  res.json({ success: true, backup: backupPath });
});
```

**Option 3: Download Database**

Add an admin endpoint to download the database:

```typescript
app.get('/admin/download-db', (req, res) => {
  // Add authentication here!
  res.download(process.env.SQLITE_DB_PATH!);
});
```

## Monitoring

### View Logs
- Go to your web service dashboard
- Click **Logs** tab
- View real-time application logs
- Look for: "SQLite database initialized at: /data/secret_messages.db"

### Metrics
- **Metrics** tab shows:
  - CPU usage
  - Memory usage
  - Disk usage
  - Request count
  - Response times

### Disk Usage
- **Disks** tab shows storage usage
- Monitor to ensure you don't exceed allocated space
- Upgrade disk size if needed

## Scaling Considerations

### When SQLite Works Well
- ✅ Low to medium traffic (< 1000 requests/min)
- ✅ Single server deployment
- ✅ Read-heavy workloads
- ✅ Simple deployment needs

### When to Switch to PostgreSQL
- ❌ High traffic (> 1000 requests/min)
- ❌ Need horizontal scaling (multiple servers)
- ❌ Write-heavy workloads
- ❌ Need advanced database features

### Vertical Scaling (More Resources)
1. Go to web service **Settings**
2. Change **Instance Type** to a larger plan
3. Click **Save Changes**

**Note**: You cannot horizontally scale (multiple instances) with SQLite since it's a file-based database.

## Cost Estimates

### Minimum Production Setup
- Web Service (Starter): $7/month
- Persistent Disk (1GB): Included
- **Total**: $7/month

### Recommended Production Setup
- Web Service (Standard): $25/month (more resources)
- Persistent Disk (5GB): Included
- **Total**: $25/month

**Comparison with PostgreSQL**:
- SQLite: $7/month (single server only)
- PostgreSQL: $14/month (web + database, can scale horizontally)

## Security Checklist

- [x] HTTPS enabled automatically by Render
- [x] Environment variables encrypted at rest
- [x] Database file on persistent disk (not in code)
- [x] Rate limiting configured in app
- [x] Security headers via Helmet middleware
- [ ] Set up custom domain with your SSL certificate
- [ ] Implement database backup strategy
- [ ] Add authentication to admin endpoints
- [ ] Monitor logs for suspicious activity
- [ ] Regular security updates

## Continuous Deployment

Render automatically deploys when you push to your connected branch:

1. Make changes to your code
2. Commit and push to GitHub/GitLab
3. Render detects the push
4. Automatically builds and deploys
5. **Database persists** across deployments (on persistent disk)

To disable auto-deploy:
- **Settings** → **Build & Deploy**
- Toggle **Auto-Deploy** off

## Migration from SQLite to PostgreSQL

If you outgrow SQLite, here's how to migrate:

1. Export SQLite data:
```bash
sqlite3 /data/secret_messages.db .dump > backup.sql
```

2. Create PostgreSQL database on Render

3. Convert SQLite dump to PostgreSQL format (adjust AUTO_INCREMENT, etc.)

4. Import to PostgreSQL

5. Update environment variables:
   - Set `USE_SQLITE=false`
   - Add `DATABASE_URL`

6. Redeploy

## Alternative: Use PostgreSQL Instead

**Recommendation**: Consider using PostgreSQL from the start because:

- Same cost ($7/month web + $7/month db = $14/month)
- Better for scaling
- Can add multiple web servers
- Automatic backups included
- Better for production use

See `RENDER_DEPLOYMENT.md` for PostgreSQL setup.

## Support

- [Render Documentation](https://render.com/docs)
- [Render Disks Documentation](https://render.com/docs/disks)
- [Render Community Forum](https://community.render.com)
- [Render Status Page](https://status.render.com)

## Next Steps

After successful deployment:

1. Test all functionality thoroughly
2. Verify database persists across deploys
3. Set up monitoring and alerts
4. Implement backup strategy
5. Configure custom domain (optional)
6. Monitor disk usage
7. Consider PostgreSQL if you need to scale

---

**Your app is now live with SQLite!** 🎉

Visit `https://your-app-name.onrender.com` to start sharing secret messages securely.

**Note**: Remember that SQLite limits you to a single server. For production apps with growth potential, PostgreSQL is recommended.
