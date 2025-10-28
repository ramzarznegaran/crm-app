# Deployment Guide - Shared Mobile Contact CRM

This guide will help you deploy your Contact CRM backend to Cloudflare Workers with D1 database.

## Prerequisites

1. **Cloudflare Account** - Sign up at https://dash.cloudflare.com/sign-up
2. **Node.js & npm** - Install from https://nodejs.org/
3. **Wrangler CLI** - Cloudflare's command-line tool

## Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

## Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open a browser window for you to authorize Wrangler.

## Step 3: Create D1 Database

```bash
wrangler d1 create contact-crm-db
```

**Important:** Copy the `database_id` from the output. It will look like:
```
✅ Successfully created DB 'contact-crm-db'
binding = "DB"
database_name = "contact-crm-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

## Step 4: Update wrangler.toml

Open `wrangler.toml` and replace `YOUR_DATABASE_ID_HERE` with your actual database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "contact-crm-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Your actual ID here
```

## Step 5: Initialize Database Schema

Run the SQL schema to create tables:

```bash
wrangler d1 execute contact-crm-db --file=backend/db/schema.sql
```

This will create:
- `organizations` table
- `users` table (with default admin user)
- `contacts` table
- `calls` table
- All necessary indexes

## Step 6: Verify Database Setup

Check if tables were created:

```bash
wrangler d1 execute contact-crm-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

You should see: organizations, users, contacts, calls

## Step 7: Test Default Admin User

The schema creates a default admin user:
- **Email:** admin@example.com
- **Password:** admin123
- **Role:** owner

**IMPORTANT:** Change this password immediately after first login!

## Step 8: Deploy to Cloudflare Workers

```bash
wrangler deploy
```

This will:
1. Build your backend
2. Upload to Cloudflare Workers
3. Return a URL like: `https://contact-crm-api.YOUR-SUBDOMAIN.workers.dev`

## Step 9: Update Frontend Configuration

Copy your Worker URL and update your app's environment:

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_RORK_API_BASE_URL=https://contact-crm-api.YOUR-SUBDOMAIN.workers.dev
```

Or update it in your hosting platform's environment variables.

## Step 10: Test the API

Test if your API is running:

```bash
curl https://contact-crm-api.YOUR-SUBDOMAIN.workers.dev/
```

You should see:
```json
{"status":"ok","message":"API is running"}
```

## Step 11: Test Authentication

Test login with the default admin:

```bash
curl -X POST https://contact-crm-api.YOUR-SUBDOMAIN.workers.dev/api/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## Local Development

For local development with D1:

```bash
wrangler dev
```

This starts a local server with D1 database emulation.

## Database Management

### View all users:
```bash
wrangler d1 execute contact-crm-db --command="SELECT * FROM users"
```

### View all contacts:
```bash
wrangler d1 execute contact-crm-db --command="SELECT * FROM contacts"
```

### Create a new user (as admin):
Use the app's user management feature or make a tRPC call to `users.create`

### Backup database:
```bash
wrangler d1 export contact-crm-db --output=backup.sql
```

### Restore database:
```bash
wrangler d1 execute contact-crm-db --file=backup.sql
```

## Security Recommendations

1. **Change Default Password**
   - Login as admin@example.com
   - Create a new admin user with a strong password
   - Delete or disable the default admin

2. **Use Environment Variables**
   - Never commit API keys or secrets
   - Use Wrangler secrets for sensitive data:
   ```bash
   wrangler secret put JWT_SECRET
   ```

3. **Enable CORS Properly**
   - Update CORS settings in `backend/hono.ts` to only allow your app's domain

4. **Monitor Usage**
   - Check Cloudflare dashboard for API usage
   - Set up alerts for unusual activity

## Troubleshooting

### Error: "Database not found"
- Make sure you created the D1 database
- Verify the database_id in wrangler.toml matches your created database

### Error: "Table doesn't exist"
- Run the schema.sql file again
- Check if the SQL executed successfully

### Error: "Unauthorized"
- Check if the token is being sent in the Authorization header
- Verify the token format: `Bearer <token>`

### Call Log Sync Not Working
- Call log syncing requires a standalone build (not Expo Go)
- Ensure Android permissions are granted
- Check Android logs for permission errors

## Production Checklist

- [ ] Database created and schema initialized
- [ ] Default admin password changed
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] API deployed and accessible
- [ ] Frontend connected to backend
- [ ] Authentication working
- [ ] Contact CRUD operations tested
- [ ] Call log sync tested (on standalone build)
- [ ] Monitoring and alerts set up

## Support

For issues:
1. Check Cloudflare Workers logs: `wrangler tail`
2. Check D1 database status in Cloudflare dashboard
3. Review API responses for error messages

## Cost Estimate

Cloudflare Workers Free Tier includes:
- 100,000 requests/day
- 10 GB D1 database storage
- 5 million D1 reads/day
- 100,000 D1 writes/day

This should be sufficient for small to medium teams. Monitor usage in Cloudflare dashboard.
