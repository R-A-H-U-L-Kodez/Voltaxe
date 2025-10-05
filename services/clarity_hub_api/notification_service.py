"""
Voltaxe Notification Service
Handles email and push notifications for security alerts and system events.
"""
import os
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sendgrid import SendGridAPIClient  # type: ignore
from sendgrid.helpers.mail import Mail, Email, To, Content  # type: ignore
from pywebpush import webpush, WebPushException  # type: ignore
import json

logger = logging.getLogger(__name__)

class NotificationType(Enum):
    """Types of notifications"""
    CRITICAL_ALERT = "critical_alert"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    SYSTEM_UPDATE = "system_update"
    VULNERABILITY_DETECTED = "vulnerability_detected"
    ENDPOINT_ISOLATED = "endpoint_isolated"
    ENDPOINT_RESTORED = "endpoint_restored"
    THREAT_MITIGATED = "threat_mitigated"

class NotificationChannel(Enum):
    """Notification delivery channels"""
    EMAIL = "email"
    PUSH = "push"
    BOTH = "both"

class NotificationService:
    """
    Unified notification service supporting email (SendGrid) and push notifications.
    """
    
    def __init__(self):
        # SendGrid configuration
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY", "")
        self.sendgrid_from_email = os.getenv("SENDGRID_FROM_EMAIL", "alerts@voltaxe.com")
        self.sendgrid_from_name = os.getenv("SENDGRID_FROM_NAME", "Voltaxe Security")
        self.use_sendgrid = bool(self.sendgrid_api_key)
        
        # Fallback SMTP configuration
        self.smtp_host = os.getenv("SMTP_HOST", "localhost")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
        
        # Web Push configuration (VAPID keys)
        self.vapid_private_key = os.getenv("VAPID_PRIVATE_KEY", "")
        self.vapid_public_key = os.getenv("VAPID_PUBLIC_KEY", "")
        self.vapid_claims = {
            "sub": os.getenv("VAPID_SUBJECT", "mailto:admin@voltaxe.com")
        }
        
        # Notification storage (in production, use database)
        self.push_subscriptions: Dict[str, List[Dict]] = {}  # user_id -> [subscription]
        self.user_preferences: Dict[str, Dict] = {}  # user_id -> preferences
        
        logger.info(f"[NOTIFICATIONS] Service initialized")
        logger.info(f"[NOTIFICATIONS] SendGrid: {'enabled' if self.use_sendgrid else 'disabled'}")
        logger.info(f"[NOTIFICATIONS] Web Push: {'enabled' if self.vapid_private_key else 'disabled'}")
    
    async def send_notification(
        self,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        channel: NotificationChannel = NotificationChannel.BOTH
    ) -> Dict[str, Any]:
        """
        Send a notification through specified channel(s).
        """
        results = {
            "success": False,
            "email_sent": False,
            "push_sent": False,
            "errors": []
        }
        
        # Get user preferences
        prefs = self.user_preferences.get(user_id, {})
        email_enabled = prefs.get("emailNotifications", True)
        push_enabled = prefs.get("desktopNotifications", True)
        
        # Check notification type preferences
        type_enabled = self._check_notification_type_enabled(user_id, notification_type)
        if not type_enabled:
            logger.info(f"[NOTIFICATIONS] Type {notification_type.value} disabled for user {user_id}")
            results["success"] = True
            results["message"] = "Notification type disabled by user preferences"
            return results
        
        user_email = prefs.get("email", "")
        
        # Send email notification
        if channel in [NotificationChannel.EMAIL, NotificationChannel.BOTH] and email_enabled and user_email:
            try:
                email_result = await self._send_email(
                    to_email=user_email,
                    subject=title,
                    body=message,
                    notification_type=notification_type,
                    data=data
                )
                results["email_sent"] = email_result
            except Exception as e:
                logger.error(f"[NOTIFICATIONS] Email send failed: {e}")
                results["errors"].append(f"Email error: {str(e)}")
        
        # Send push notification
        if channel in [NotificationChannel.PUSH, NotificationChannel.BOTH] and push_enabled:
            try:
                push_result = await self._send_push(
                    user_id=user_id,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    data=data
                )
                results["push_sent"] = push_result
            except Exception as e:
                logger.error(f"[NOTIFICATIONS] Push send failed: {e}")
                results["errors"].append(f"Push error: {str(e)}")
        
        results["success"] = results["email_sent"] or results["push_sent"]
        
        logger.info(f"[NOTIFICATIONS] Sent to {user_id}: email={results['email_sent']}, push={results['push_sent']}")
        
        return results
    
    async def _send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        notification_type: NotificationType,
        data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send email using SendGrid or fallback SMTP.
        """
        html_content = self._generate_email_html(subject, body, notification_type, data)
        
        if self.use_sendgrid:
            return await self._send_email_sendgrid(to_email, subject, html_content)
        else:
            return await self._send_email_smtp(to_email, subject, html_content)
    
    async def _send_email_sendgrid(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send email via SendGrid"""
        try:
            message = Mail(
                from_email=Email(self.sendgrid_from_email, self.sendgrid_from_name),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            sg = SendGridAPIClient(self.sendgrid_api_key)
            response = sg.send(message)
            
            logger.info(f"[NOTIFICATIONS] SendGrid email sent to {to_email}: status={response.status_code}")
            return response.status_code in [200, 201, 202]
        except Exception as e:
            logger.error(f"[NOTIFICATIONS] SendGrid error: {e}")
            return False
    
    async def _send_email_smtp(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send email via SMTP (fallback)"""
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.sendgrid_from_name} <{self.sendgrid_from_email}>"
            msg['To'] = to_email
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.smtp_use_tls:
                    server.starttls()
                if self.smtp_username and self.smtp_password:
                    server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"[NOTIFICATIONS] SMTP email sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"[NOTIFICATIONS] SMTP error: {e}")
            return False
    
    async def _send_push(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: NotificationType,
        data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send browser push notification to all user's subscribed devices.
        """
        if not self.vapid_private_key:
            logger.warning("[NOTIFICATIONS] Web Push not configured (missing VAPID keys)")
            return False
        
        subscriptions = self.push_subscriptions.get(user_id, [])
        if not subscriptions:
            logger.info(f"[NOTIFICATIONS] No push subscriptions for user {user_id}")
            return False
        
        payload = json.dumps({
            "title": title,
            "body": message,
            "icon": "/voltaxe-icon.png",
            "badge": "/voltaxe-badge.png",
            "tag": notification_type.value,
            "data": data or {},
            "timestamp": datetime.utcnow().isoformat(),
            "requireInteraction": notification_type in [
                NotificationType.CRITICAL_ALERT,
                NotificationType.ENDPOINT_ISOLATED
            ]
        })
        
        sent_count = 0
        failed_subscriptions = []
        
        for subscription in subscriptions:
            try:
                webpush(
                    subscription_info=subscription,
                    data=payload,
                    vapid_private_key=self.vapid_private_key,
                    vapid_claims=self.vapid_claims
                )
                sent_count += 1
            except WebPushException as e:
                logger.error(f"[NOTIFICATIONS] Web push failed: {e}")
                if e.response and e.response.status_code in [404, 410]:
                    # Subscription expired or invalid, mark for removal
                    failed_subscriptions.append(subscription)
        
        # Remove failed subscriptions
        for failed_sub in failed_subscriptions:
            self.push_subscriptions[user_id].remove(failed_sub)
        
        logger.info(f"[NOTIFICATIONS] Push sent to {sent_count}/{len(subscriptions)} devices for user {user_id}")
        
        return sent_count > 0
    
    def _generate_email_html(
        self,
        subject: str,
        body: str,
        notification_type: NotificationType,
        data: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate HTML email template.
        """
        # Color based on notification type
        color_map = {
            NotificationType.CRITICAL_ALERT: "#DC2626",
            NotificationType.SUSPICIOUS_ACTIVITY: "#F59E0B",
            NotificationType.VULNERABILITY_DETECTED: "#EF4444",
            NotificationType.ENDPOINT_ISOLATED: "#DC2626",
            NotificationType.ENDPOINT_RESTORED: "#10B981",
            NotificationType.THREAT_MITIGATED: "#10B981",
            NotificationType.SYSTEM_UPDATE: "#3B82F6",
        }
        
        primary_color = color_map.get(notification_type, "#D4AF37")
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f0f;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%); padding: 16px; border-radius: 16px; box-shadow: 0 8px 24px rgba(212, 175, 55, 0.4);">
                        <span style="font-size: 32px; font-weight: bold; color: #0f0f0f;">⚡ Voltaxe</span>
                    </div>
                </div>
                
                <!-- Content Card -->
                <div style="background-color: #1a1a1a; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); border: 1px solid #2a2a2a;">
                    <!-- Alert Badge -->
                    <div style="display: inline-block; background-color: {primary_color}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 20px;">
                        {notification_type.value.replace('_', ' ')}
                    </div>
                    
                    <!-- Title -->
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0; font-weight: 600;">
                        {subject}
                    </h1>
                    
                    <!-- Message -->
                    <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                        {body}
                    </p>
                    
                    <!-- Data Section -->
                    {self._generate_data_section(data) if data else ''}
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin-top: 32px;">
                        <a href="http://localhost:3000" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%); color: #0f0f0f; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);">
                            View Dashboard
                        </a>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px; color: #666; font-size: 14px;">
                    <p style="margin: 0 0 8px 0;">Voltaxe Security Monitoring Platform</p>
                    <p style="margin: 0; font-size: 12px;">
                        This is an automated security notification. Please do not reply to this email.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def _generate_data_section(self, data: Dict[str, Any]) -> str:
        """Generate HTML for data section in email"""
        if not data:
            return ""
        
        rows = ""
        for key, value in data.items():
            formatted_key = key.replace('_', ' ').title()
            rows += f"""
            <tr>
                <td style="padding: 12px; color: #a0a0a0; font-size: 14px; border-bottom: 1px solid #2a2a2a;">
                    {formatted_key}
                </td>
                <td style="padding: 12px; color: #ffffff; font-size: 14px; font-weight: 500; border-bottom: 1px solid #2a2a2a;">
                    {value}
                </td>
            </tr>
            """
        
        return f"""
        <div style="margin-top: 24px; background-color: #0f0f0f; border-radius: 8px; padding: 16px; border: 1px solid #2a2a2a;">
            <h3 style="color: #D4AF37; font-size: 16px; margin: 0 0 16px 0;">Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
                {rows}
            </table>
        </div>
        """
    
    def _check_notification_type_enabled(self, user_id: str, notification_type: NotificationType) -> bool:
        """Check if specific notification type is enabled for user"""
        prefs = self.user_preferences.get(user_id, {})
        
        type_map = {
            NotificationType.CRITICAL_ALERT: prefs.get("criticalAlerts", True),
            NotificationType.SUSPICIOUS_ACTIVITY: prefs.get("suspiciousActivity", True),
            NotificationType.SYSTEM_UPDATE: prefs.get("systemUpdates", False),
            NotificationType.VULNERABILITY_DETECTED: prefs.get("criticalAlerts", True),
            NotificationType.ENDPOINT_ISOLATED: prefs.get("criticalAlerts", True),
            NotificationType.ENDPOINT_RESTORED: prefs.get("suspiciousActivity", True),
            NotificationType.THREAT_MITIGATED: prefs.get("suspiciousActivity", True),
        }
        
        return type_map.get(notification_type, True)
    
    def subscribe_push(self, user_id: str, subscription: Dict[str, Any]) -> bool:
        """
        Register a push notification subscription for a user.
        """
        if user_id not in self.push_subscriptions:
            self.push_subscriptions[user_id] = []
        
        # Check if subscription already exists
        endpoint = subscription.get("endpoint")
        existing = [s for s in self.push_subscriptions[user_id] if s.get("endpoint") == endpoint]
        
        if not existing:
            self.push_subscriptions[user_id].append(subscription)
            logger.info(f"[NOTIFICATIONS] New push subscription for user {user_id}")
            return True
        
        return False
    
    def unsubscribe_push(self, user_id: str, endpoint: str) -> bool:
        """Remove a push notification subscription"""
        if user_id in self.push_subscriptions:
            original_count = len(self.push_subscriptions[user_id])
            self.push_subscriptions[user_id] = [
                s for s in self.push_subscriptions[user_id]
                if s.get("endpoint") != endpoint
            ]
            removed = original_count - len(self.push_subscriptions[user_id])
            if removed > 0:
                logger.info(f"[NOTIFICATIONS] Removed push subscription for user {user_id}")
                return True
        
        return False
    
    def update_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> None:
        """Update notification preferences for a user"""
        self.user_preferences[user_id] = preferences
        logger.info(f"[NOTIFICATIONS] Updated preferences for user {user_id}")
    
    def get_vapid_public_key(self) -> str:
        """Get VAPID public key for client-side push subscription"""
        return self.vapid_public_key

# Global notification service instance
notification_service = NotificationService()
