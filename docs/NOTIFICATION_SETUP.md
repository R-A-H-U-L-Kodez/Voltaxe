# Notification System Setup Guide

## ✅ Implementation Complete!

The Voltaxe notification system has been successfully implemented with:

- ✅ Email notifications (SendGrid + SMTP fallback)
- ✅ Browser push notifications (Web Push API)
- ✅ Service Worker for offline notifications
- ✅ Settings page integration
- ✅ Automatic notifications for Strike Module actions
- ✅ Test notification functionality

## Quick Start

### 1. Configure Environment Variables

Add these to your `.env` file in `services/clarity_hub_api/`:

```bash
# Web Push (VAPID Keys) - GENERATED FOR YOU
VAPID_PUBLIC_KEY=BJm5_SIaBMaaPLC0AH4kzaARhern0byf4NGu-YLmFqDcKzkgLrZ6PY-WxOyhkhXBotinKoDblFA83rac82J-3lM
VAPID_PRIVATE_KEY=O0IighvZZPE_Iob5mHM7ojsY7LDkOGEextVJ8VJ_8Ys
VAPID_SUBJECT=mailto:admin@voltaxe.com

# SendGrid (Optional - for email notifications)
# Sign up at https://sendgrid.com for a free API key
SENDGRID_API_KEY=your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=alerts@voltaxe.com
SENDGRID_FROM_NAME=Voltaxe Security

# SMTP Fallback (if not using SendGrid)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true
```

### 2. Restart Services

```bash
cd /home/rahul/Voltaxe/Voltaxe
sudo docker-compose restart api
```

### 3. Enable Notifications in Browser

1. Open http://localhost:3000
2. Login with admin@voltaxe.com / password
3. Go to **Settings** page
4. Scroll to **Notifications** section
5. Toggle **Desktop Notifications** ON
6. Grant permission when browser prompts
7. Click **Send Test** button to verify

## Features

### Browser Push Notifications

- Real-time alerts even when dashboard is closed
- Works in Chrome, Firefox, Edge
- Requires HTTPS in production (works on localhost for development)
- Automatic retry and error handling

### Email Notifications

- Beautiful HTML email templates
- SendGrid for reliable delivery
- SMTP fallback for self-hosted email
- Supports all notification types

### Notification Types

1. **🚨 Critical Alerts** - High-priority security events
2. **🔍 Suspicious Activity** - Potential threats detected
3. **⚡ Endpoint Isolated** - Automated isolation by Strike Module
4. **✅ Endpoint Restored** - Network access restored
5. **🛡️ Vulnerability Detected** - CVE vulnerabilities found
6. **🔧 System Updates** - Platform updates

### Settings & Preferences

Users can control:
- Email notifications ON/OFF
- Desktop notifications ON/OFF
- Critical alerts ON/OFF
- Suspicious activity alerts ON/OFF
- System updates ON/OFF

## Automatic Notifications

The system automatically sends notifications for:

### Endpoint Isolation
When you click "Isolate Endpoint" button:
- ✅ Push notification sent immediately
- ✅ Email notification sent (if enabled)
- ✅ Title: "🚨 Endpoint Isolated: {hostname}"
- ✅ Includes isolation details

### Endpoint Restoration
When you click "Restore" to re-enable network:
- ✅ Push notification sent
- ✅ Email notification sent
- ✅ Title: "✅ Endpoint Restored: {hostname}"

## Testing

### Test Push Notifications

1. Go to Settings → Notifications
2. Enable "Desktop Notifications"
3. Click "Send Test" button
4. You should see a notification appear

### Test Email Notifications

**Option 1: Via Settings (when email configured)**
```bash
# Same as push - click "Send Test" button in Settings
```

**Option 2: Via API**
```bash
# Get auth token
TOKEN=$(cat /tmp/auth.json | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Send test notification
curl -X POST http://localhost:8000/notifications/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test notification from Voltaxe",
    "notification_type": "system_update",
    "channel": "both"
  }'
```

### Test with Real Actions

1. Go to an endpoint detail page (e.g., http://localhost:3000/endpoints/kali)
2. Click "Isolate Endpoint"
3. You should receive a notification: "🚨 Endpoint Isolated: kali"
4. Click "Restore Network"
5. You should receive: "✅ Endpoint Restored: kali"

## API Endpoints

### Get VAPID Public Key
```
GET /notifications/vapid-public-key
```

### Subscribe to Push
```
POST /notifications/subscribe-push
{
  "endpoint": "https://...",
  "keys": { "p256dh": "...", "auth": "..." }
}
```

### Update Preferences
```
POST /notifications/preferences
{
  "email": "user@example.com",
  "emailNotifications": true,
  "desktopNotifications": true,
  "criticalAlerts": true,
  "suspiciousActivity": true,
  "systemUpdates": false
}
```

### Send Notification
```
POST /notifications/send
{
  "title": "Alert Title",
  "message": "Alert message",
  "notification_type": "critical_alert",
  "channel": "both"
}
```

## SendGrid Setup (For Email Notifications)

### 1. Create Account
- Go to https://sendgrid.com
- Sign up for a free account (100 emails/day)

### 2. Verify Sender Email
- Settings → Sender Authentication
- Verify your sender email address

### 3. Create API Key
- Settings → API Keys
- Click "Create API Key"
- Give it "Mail Send" permissions
- Copy the API key

### 4. Add to .env
```bash
SENDGRID_API_KEY=SG.your-api-key-here
SENDGRID_FROM_EMAIL=alerts@yourdomain.com
SENDGRID_FROM_NAME=Voltaxe Security
```

### 5. Restart API
```bash
sudo docker-compose restart api
```

## Troubleshooting

### Push Notifications Not Working

**Check Browser Support:**
```javascript
// Open browser console and run:
console.log('Notification' in window);  // Should be true
console.log('serviceWorker' in navigator);  // Should be true
```

**Check Service Worker:**
1. Open DevTools (F12)
2. Go to Application tab
3. Click Service Workers
4. Verify `sw.js` is active

**Check Permissions:**
1. Chrome: `chrome://settings/content/notifications`
2. Firefox: Site settings → Permissions → Notifications
3. Ensure Voltaxe is "Allowed"

**View Logs:**
```bash
# API logs
sudo docker-compose logs api | grep NOTIFICATIONS

# Browser console
# Open DevTools → Console
# Look for [NOTIFICATIONS] messages
```

### Email Notifications Not Working

**Check SendGrid Status:**
- Login to SendGrid dashboard
- Check Activity Feed for errors
- Verify sender email is authenticated

**Check SMTP Connection:**
```bash
# Test SMTP manually
telnet smtp.gmail.com 587
```

**Check API Logs:**
```bash
sudo docker-compose logs api | grep -i "email\|sendgrid\|smtp"
```

## Architecture

```
┌──────────────────────────────────────────────────┐
│              NOTIFICATION FLOW                    │
├──────────────────────────────────────────────────┤
│                                                   │
│  User Action (Isolate Endpoint)                  │
│         │                                         │
│         ▼                                         │
│  Strike Module                                    │
│         │                                         │
│         ▼                                         │
│  Notification Service                             │
│         │                                         │
│         ├──────────────┬──────────────┐          │
│         ▼              ▼              ▼          │
│    SendGrid      Web Push API   SMTP Server      │
│         │              │              │          │
│         ▼              ▼              ▼          │
│    Email Inbox   Browser Push   Email Inbox      │
│                                                   │
└──────────────────────────────────────────────────┘
```

## File Structure

```
services/clarity_hub_api/
├── notification_service.py          # Backend notification service
├── main.py                          # API endpoints added
└── requirements.txt                 # Added sendgrid, pywebpush

services/clarity_hub_ui/
├── src/
│   ├── services/
│   │   └── notificationService.ts   # Frontend notification service
│   └── pages/
│       └── SettingsPage.tsx         # Updated with notification UI
└── public/
    └── sw.js                        # Service Worker for push notifications

docs/
├── NOTIFICATIONS.md                 # Full documentation
└── NOTIFICATION_SETUP.md            # This file
```

## Next Steps

1. **Configure Email** (Optional):
   - Get SendGrid API key
   - Or configure SMTP server
   - Add credentials to `.env`

2. **Test Notifications**:
   - Enable desktop notifications in Settings
   - Send test notification
   - Try isolating an endpoint

3. **Customize**:
   - Adjust notification preferences per user
   - Add custom notification types
   - Customize email templates

4. **Production**:
   - Set up HTTPS for push notifications
   - Configure production SendGrid account
   - Set up monitoring for notification delivery

## Support

- **Documentation**: See `docs/NOTIFICATIONS.md`
- **Logs**: `sudo docker-compose logs api | grep NOTIFICATIONS`
- **Browser Console**: Check for [NOTIFICATIONS] messages

---

**🎉 The notification system is ready to use!**

Test it now by:
1. Going to Settings → Enable Desktop Notifications
2. Click "Send Test" - you should see a notification!
3. Go to an endpoint and click "Isolate Endpoint"
4. You'll get a real-time notification about the action!
