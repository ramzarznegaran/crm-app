# Shared Mobile Contact CRM - Setup Guide

## Overview

This is a complete Contact CRM system with:
- **Backend**: Cloudflare Workers + D1 Database (SQLite)
- **Frontend**: React Native (Expo) mobile app
- **Features**: 
  - Shared contacts across team members
  - Automatic call log syncing (Android)
  - Role-based permissions (Owner/User)
  - No duplicate phone numbers
  - Real-time sync across devices

## Quick Start

### 1. Required Information

Before starting, you'll need:
- Cloudflare account (free tier works)
- Your Cloudflare Account ID
- A Cloudflare API Token with Workers and D1 permissions

### 2. Backend Setup (Cloudflare)

Follow the detailed instructions in `DEPLOYMENT.md`:

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create contact-crm-db

# Update wrangler.toml with your database_id

# Initialize database
wrangler d1 execute contact-crm-db --file=backend/db/schema.sql

# Deploy
wrangler deploy
```

### 3. Frontend Setup

Update your environment with the Worker URL:

```bash
# Create .env file
echo "EXPO_PUBLIC_RORK_API_BASE_URL=https://your-worker.workers.dev" > .env
```

### 4. Default Admin Credentials

After deployment, login with:
- **Email**: admin@example.com
- **Password**: admin123

**⚠️ IMPORTANT**: Change this password immediately!

## Architecture

### Database Schema

```
organizations
├── id (PK)
├── name
└── created_at

users
├── id (PK)
├── org_id (FK)
├── name
├── email (UNIQUE)
├── password_hash
├── role (owner/user)
└── created_at

contacts
├── id (PK)
├── org_id (FK)
├── name
├── phone_number
├── created_by_user_id (FK)
├── created_at
├── updated_at
└── UNIQUE(org_id, phone_number)  ← No duplicates!

calls
├── id (PK)
├── org_id (FK)
├── contact_id (FK, nullable)
├── user_id (FK)
├── phone_number
├── direction (incoming/outgoing)
├── start_time
├── duration
└── created_at
```

### API Endpoints (tRPC)

**Authentication:**
- `auth.login` - Login with email/password
- `auth.me` - Get current user info

**Contacts:**
- `contacts.list` - Get all contacts (org-wide)
- `contacts.create` - Add new contact
- `contacts.update` - Update contact (own or owner)
- `contacts.delete` - Delete contact (own or owner)

**Calls:**
- `calls.list` - Get call history
- `calls.create` - Log a single call
- `calls.sync` - Bulk sync call logs from device

**Users:**
- `users.list` - List all users in org
- `users.create` - Create new user (owner only)

### Permissions

**Owner:**
- Create/edit/delete ANY contact
- Create new users
- View all data

**User:**
- Create contacts
- Edit/delete ONLY their own contacts
- View all contacts (read-only for others)
- Cannot create users

### Call Log Syncing

**How it works:**
1. App requests READ_CALL_LOG permission (Android)
2. Periodically syncs call logs to server
3. Automatically links calls to existing contacts
4. Stores unmatched calls for later assignment

**Note**: Call log syncing only works in standalone builds, not in Expo Go.

## Development

### Local Backend Development

```bash
# Start local dev server with D1 emulation
wrangler dev
```

### Local Frontend Development

```bash
# Start Expo dev server
npm start
```

### Testing

Test the API:
```bash
# Health check
curl https://your-worker.workers.dev/

# Login
curl -X POST https://your-worker.workers.dev/api/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## Key Features Explained

### 1. No Duplicate Contacts

The database enforces `UNIQUE(org_id, phone_number)`. If two users try to add the same number:
- First one succeeds
- Second one gets an error: "Contact with this phone number already exists"

### 2. Ownership & Permissions

Each contact has `created_by_user_id`:
- Users can only edit/delete their own contacts
- Owners can edit/delete any contact
- Everyone can VIEW all contacts

### 3. Call Log Syncing

On Android devices:
- App requests permission to read call logs
- Syncs new calls since last sync
- Matches phone numbers to existing contacts
- Stores call history with duration and direction

### 4. Multi-Device Sync

All data is stored in Cloudflare D1:
- Changes sync instantly across devices
- No local-only data (except auth tokens)
- Works offline with React Query caching

## Security

### Authentication

- JWT-like tokens (base64 encoded)
- Tokens stored in AsyncStorage
- Sent as `Authorization: Bearer <token>` header
- Validated on every protected endpoint

### Password Storage

- Passwords hashed with SHA-256
- Never stored in plain text
- Never sent to frontend

### API Security

- CORS enabled (configure for your domain)
- Rate limiting via Cloudflare
- Input validation with Zod schemas

## Monitoring

### Cloudflare Dashboard

Monitor:
- Request count
- Error rate
- Database queries
- Response times

### Logs

```bash
# Tail live logs
wrangler tail

# View specific request
wrangler tail --format=pretty
```

## Troubleshooting

### "Database not found"
→ Run `wrangler d1 create contact-crm-db` and update wrangler.toml

### "Unauthorized" errors
→ Check if token is being sent in headers
→ Verify token hasn't expired

### Call logs not syncing
→ Only works in standalone builds (not Expo Go)
→ Check Android permissions are granted

### Duplicate contact error
→ This is expected! Phone numbers must be unique
→ Search for existing contact first

## Production Deployment

### Checklist

- [ ] Change default admin password
- [ ] Update CORS settings for your domain
- [ ] Set up monitoring alerts
- [ ] Configure rate limiting
- [ ] Test all API endpoints
- [ ] Test on real Android device
- [ ] Set up database backups

### Backup Strategy

```bash
# Export database
wrangler d1 export contact-crm-db --output=backup-$(date +%Y%m%d).sql

# Restore if needed
wrangler d1 execute contact-crm-db --file=backup-20241004.sql
```

## Scaling

Cloudflare Free Tier limits:
- 100,000 requests/day
- 10 GB database storage
- 5M reads/day, 100K writes/day

For larger teams, upgrade to Cloudflare Workers Paid plan.

## Support & Resources

- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **D1 Database Docs**: https://developers.cloudflare.com/d1/
- **tRPC Docs**: https://trpc.io/
- **Expo Docs**: https://docs.expo.dev/

## Next Steps

1. Deploy backend following DEPLOYMENT.md
2. Update frontend with your Worker URL
3. Login with default admin
4. Create your first user
5. Add contacts and test syncing
6. Build standalone app for call log testing

## License

[Your License Here]


eas build --platform android --local