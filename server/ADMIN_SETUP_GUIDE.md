# Admin Setup Guide

## Overview

This guide explains how to set up and manage admin users in the BidCart E-commerce system.

## Security Improvements

### ✅ Fixed Security Issues:
1. **Removed plaintext password logging** - Passwords are no longer displayed in console output
2. **Environment variable configuration** - Admin credentials are now configured via environment variables
3. **Proper password hashing** - All passwords are automatically hashed using bcrypt before storage

### 🔒 Security Best Practices:
- Passwords are never stored or logged in plaintext
- Default passwords should be changed immediately after first login
- Use strong, unique passwords for each admin account
- Environment variables provide secure credential management

## Setup Instructions

### 1. Configure Environment Variables

Copy the example environment file and update with your credentials:

```bash
cp .env.example .env
```

Edit the `.env` file with your admin credentials:

```env
# Admin User 1 Configuration
ADMIN1_NAME=Your Name
ADMIN1_EMAIL=your.email@example.com
ADMIN1_PASSWORD=YourStrongPassword123!
ADMIN1_PHONE=+1234567890

# Admin User 2 Configuration  
ADMIN2_NAME=Admin Two
ADMIN2_EMAIL=admin2@example.com
ADMIN2_PASSWORD=AnotherStrongPassword456!
ADMIN2_PHONE=+1234567890

# Admin User 3 Configuration
ADMIN3_NAME=Admin Three
ADMIN3_EMAIL=admin3@example.com
ADMIN3_PASSWORD=ThirdStrongPassword789!
ADMIN3_PHONE=+1234567890
```

### 2. Start the Server

Admin users are automatically created when the server starts:

```bash
npm start
```

Or for development:

```bash
npm run dev
```

### 3. Verify Admin Setup

Admin users are automatically created and verified when the server starts. Check the server logs for confirmation messages.

## Default Admin Accounts

The system creates three admin accounts by default (configurable via environment variables):

1. **Primary Admin** - Full system administrator
2. **Secondary Admin** - Backup administrator  
3. **Platform Manager** - Operational management

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- At least one special character

## Testing Admin Login

### Method 1: Web Interface
1. Open http://localhost:3000/login
2. Use admin email and password
3. Select "Admin" role

### Method 2: API Testing
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword","role":"admin"}'
```

## Troubleshooting

### Common Issues:

1. **"No admin users found"**
   - Check MongoDB connection
   - Verify .env file configuration
   - Restart the server

2. **"Invalid credentials"**  
   - Verify password in .env file
   - Check for typos in email/password

3. **"Connection refused"**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env

### Testing Commands:

```bash
# Test the server startup and admin creation
npm start

# Check server logs for admin creation confirmation
# Admin users are automatically created on server startup
```

## Security Recommendations

1. **Change default passwords** immediately after first login
2. **Use different passwords** for each admin account
3. **Rotate passwords** regularly (every 90 days)
4. **Enable 2FA** when available
5. **Restrict admin access** to authorized personnel only
6. **Monitor admin activity** through audit logs

## File Structure

- `createAdmin.js` - Admin user creation script
- `.env.example` - Environment variable template
- `models/User.js` - User model with password hashing
- `controllers/authController.js` - Authentication logic

## Support

For admin setup issues, check:
1. MongoDB connection status
2. Environment variable configuration
3. Server logs for error messages
4. Test scripts for specific issues
