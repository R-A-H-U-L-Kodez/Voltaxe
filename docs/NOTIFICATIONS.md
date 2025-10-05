# Voltaxe Notification System

## Overview

The Voltaxe notification system provides real-time alerts for security events through multiple channels:
- **Email Notifications** - Via SendGrid or SMTP
- **Browser Push Notifications** - Using Web Push API and Service Workers

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NOTIFICATION FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐         ┌────────────┐        ┌─────────┐    │
│  │  Event   │────────▶│ Notification│───────▶│  Email  │    │
│  │ Trigger  │         │   Service   │        │SendGrid │    │
│  └──────────┘         └────────────┘        └─────────┘    │
│       │                      │                              │
│       │                      │                              │
│       │                      ▼                              │
│       │               ┌────────────┐                        │
│       │               │  Web Push  │                        │
│       │               │   Server   │                        │
│       │               └────────────┘                        │
│       │                      │                              │
│       │                      ▼                              │
│       │               ┌────────────┐                        │
│       └──────────────▶│  Service   │                        │
│                       │   Worker   │                        │
│                       └────────────┘                        │
│                              │                              │
│                              ▼                              │
│                       ┌────────────┐                        │
│                       │  Browser   │                        │
│                       │Notification│                        │
│                       └────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 1. Email Notifications
- **SendGrid Integration** - Professional email delivery service
- **SMTP Fallback** - Works with any SMTP server
- **HTML Templates** - Beautifully designed email templates
- **Event-based** - Automatic alerts for security events

### 2. Browser Push Notifications
- **Web Push API** - Standard browser push notifications
- **Service Worker** - Background notification handling
- **VAPID Authentication** - Secure push delivery
- **Offline Support** - Notifications even when tab is closed

### 3. Notification Types
- 🚨 **Critical Alerts** - High-priority security events
- 🔍 **Suspicious Activity** - Potential threats detected
- ⚡ **Endpoint Isolated** - Automated response actions
- ✅ **Endpoint Restored** - Network access restored
- 🛡️ **Vulnerability Detected** - CVE vulnerabilities found
- 🔧 **System Updates** - Platform updates and maintenance

## Configuration

### Backend Configuration

Create a `.env` file in the API directory:

```bash
# SendGrid Configuration (Recommended)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=alerts@voltaxe.com
SENDGRID_FROM_NAME=Voltaxe Security

# SMTP Fallback (if not using SendGrid)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true

# Web Push (VAPID Keys)
# Generate keys with: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=your-private-key-here
VAPID_PUBLIC_KEY=your-public-key-here
VAPID_SUBJECT=mailto:admin@voltaxe.com
```

### Generating VAPID Keys

Install web-push:
```bash
npm install -g web-push
```

Generate keys:
```bash
web-push generate-vapid-keys
```

Copy the output to your `.env` file.

### Getting SendGrid API Key

1. Sign up at [SendGrid](https://sendgrid.com)
2. Go to Settings → API Keys
3. Create a new API key with "Mail Send" permissions
4. Copy the API key to your `.env` file

## Usage

### Frontend Integration

The notification service is automatically initialized when the app loads.

#### Enable Notifications in Settings

1. Navigate to Settings page
2. Toggle "Desktop Notifications" ON
3. Grant permission when browser prompts
4. Click "Send Test" to verify

#### Manual Notification

```typescript
import { notificationService } from '../services/notificationService';

// Subscribe to push notifications
await notificationService.subscribe();

// Send a test notification
await notificationService.sendTestNotification();

// Show local notification
await notificationService.showLocalNotification(
  'Alert Title',
  {
    body: 'Alert message',
    icon: '/icon.png',
    requireInteraction: true
  }
);
```

### Backend Integration

#### Sending Notifications from Code

```python
from notification_service import notification_service, NotificationType

# Send a critical alert
await notification_service.send_notification(
    user_id="admin@voltaxe.com",
    notification_type=NotificationType.CRITICAL_ALERT,
    title="🚨 Critical Security Event",
    message="Ransomware detected on endpoint 'workstation-01'",
    data={
        "hostname": "workstation-01",
        "threat_type": "ransomware",
        "severity": "critical"
    }
)
```

#### Notification Types

```python
NotificationType.CRITICAL_ALERT           # High-priority security events
NotificationType.SUSPICIOUS_ACTIVITY      # Potential threats
NotificationType.VULNERABILITY_DETECTED   # CVE vulnerabilities
NotificationType.ENDPOINT_ISOLATED        # Automated isolation
NotificationType.ENDPOINT_RESTORED        # Network restored
NotificationType.THREAT_MITIGATED         # Threat resolved
NotificationType.SYSTEM_UPDATE            # System updates
```

#### Notification Channels

```python
NotificationChannel.EMAIL    # Email only
NotificationChannel.PUSH     # Browser push only
NotificationChannel.BOTH     # Email + Push (default)
```

## API Endpoints

### Get VAPID Public Key
```
GET /notifications/vapid-public-key
```

Returns the VAPID public key for client-side push subscription.

### Subscribe to Push Notifications
```
POST /notifications/subscribe-push
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

### Update Notification Preferences
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

### Send Notification (Testing)
```
POST /notifications/send
{
  "title": "Test Alert",
  "message": "This is a test notification",
  "notification_type": "system_update",
  "channel": "both"
}
```

## Automatic Notifications

The system automatically sends notifications for:

1. **Endpoint Isolation** - When an endpoint is isolated via Strike Module
2. **Endpoint Restoration** - When network access is restored
3. **Critical Alerts** - High-severity security events
4. **Vulnerabilities** - New CVE detections

## Troubleshooting

### Notifications Not Received

1. **Check Browser Permissions**
   - Visit `chrome://settings/content/notifications`
   - Ensure Voltaxe is allowed

2. **Verify Service Worker**
   - Open DevTools → Application → Service Workers
   - Ensure `sw.js` is active

3. **Check API Configuration**
   - Verify VAPID keys are set
   - Check SendGrid API key is valid

4. **View Logs**
   ```bash
   docker-compose logs api | grep NOTIFICATIONS
   ```

### Email Not Sending

1. **SendGrid Issues**
   - Verify API key is correct
   - Check SendGrid dashboard for errors
   - Verify sender email is verified

2. **SMTP Issues**
   - Test SMTP credentials
   - Check firewall/port access
   - Verify TLS settings

## Testing

### Test Email Notifications

```python
# In API container
python3 -c "
from notification_service import notification_service, NotificationType
import asyncio

async def test():
    await notification_service.send_notification(
        user_id='admin@voltaxe.com',
        notification_type=NotificationType.SYSTEM_UPDATE,
        title='Test Email',
        message='This is a test email from Voltaxe',
        channel=NotificationChannel.EMAIL
    )

asyncio.run(test())
"
```

### Test Push Notifications

1. Open browser DevTools → Console
2. Run:
```javascript
await notificationService.sendTestNotification();
```

## Security Considerations

- **VAPID Keys** - Keep private keys secret
- **SendGrid API Key** - Restrict permissions to Mail Send only
- **User Privacy** - Don't include sensitive data in notifications
- **Rate Limiting** - Implement rate limits for notification endpoints
- **HTTPS Required** - Service Workers require HTTPS in production

## Future Enhancements

- [ ] SMS notifications (Twilio integration)
- [ ] Slack/Teams webhooks
- [ ] Notification history dashboard
- [ ] Custom notification sounds
- [ ] Do Not Disturb schedules
- [ ] Notification priority levels
- [ ] Grouped notifications
- [ ] Rich notifications with actions

## Support

For issues or questions:
- Check logs: `docker-compose logs api`
- Review browser console
- Verify configuration in `.env`
