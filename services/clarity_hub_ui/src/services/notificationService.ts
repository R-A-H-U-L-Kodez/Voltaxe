/**
 * Voltaxe Browser Push Notification Service
 * Handles push notification subscription and display
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSubscribed = false;

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('[NOTIFICATIONS] Browser does not support notifications');
      return;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('[NOTIFICATIONS] Service workers not supported');
      return;
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('[NOTIFICATIONS] Service Worker registered');

      // Check current subscription status
      const subscription = await this.swRegistration.pushManager.getSubscription();
      this.isSubscribed = subscription !== null;

      if (this.isSubscribed) {
        console.log('[NOTIFICATIONS] Already subscribed to push notifications');
      }
    } catch (error) {
      console.error('[NOTIFICATIONS] Service Worker registration failed:', error);
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    console.log('[NOTIFICATIONS] Permission:', permission);
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<boolean> {
    if (!this.swRegistration) {
      console.error('[NOTIFICATIONS] Service Worker not registered');
      return false;
    }

    try {
      // Request permission if not granted
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('[NOTIFICATIONS] Permission denied');
        return false;
      }

      // Get VAPID public key from server
      const { data } = await api.get('/notifications/vapid-public-key');
      const vapidPublicKey = data.publicKey;

      // Subscribe to push notifications
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      // Send subscription to server
      await api.post('/notifications/subscribe-push', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
      });

      this.isSubscribed = true;
      console.log('[NOTIFICATIONS] Successfully subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('[NOTIFICATIONS] Failed to subscribe:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        // Unsubscribe on server
        await api.post('/notifications/unsubscribe-push', {
          endpoint: subscription.endpoint,
        });

        // Unsubscribe locally
        await subscription.unsubscribe();
        this.isSubscribed = false;
        console.log('[NOTIFICATIONS] Unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[NOTIFICATIONS] Failed to unsubscribe:', error);
      return false;
    }
  }

  /**
   * Check if user is subscribed
   */
  async checkSubscription(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    const subscription = await this.swRegistration.pushManager.getSubscription();
    this.isSubscribed = subscription !== null;
    return this.isSubscribed;
  }

  /**
   * Show a local notification (fallback when push is not available)
   */
  async showLocalNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('[NOTIFICATIONS] Notifications not supported');
      return;
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      return;
    }

    if (this.swRegistration) {
      // Show via service worker
      await this.swRegistration.showNotification(title, {
        icon: '/voltaxe-icon.png',
        badge: '/voltaxe-badge.png',
        ...options,
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        icon: '/voltaxe-icon.png',
        ...options,
      });
    }
  }

  /**
   * Update notification preferences on server
   */
  async updatePreferences(preferences: any): Promise<void> {
    try {
      await api.post('/notifications/preferences', preferences);
      console.log('[NOTIFICATIONS] Preferences updated');
    } catch (error) {
      console.error('[NOTIFICATIONS] Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences from server
   */
  async getPreferences(): Promise<any> {
    try {
      const { data } = await api.get('/notifications/preferences');
      return data.preferences;
    } catch (error) {
      console.error('[NOTIFICATIONS] Failed to get preferences:', error);
      return null;
    }
  }

  /**
   * Send a test notification
   */
  async sendTestNotification(): Promise<void> {
    try {
      await api.post('/notifications/send', {
        title: '🧪 Test Notification',
        message: 'This is a test notification from Voltaxe. Your notifications are working correctly!',
        notification_type: 'system_update',
        channel: 'both',
      });
      console.log('[NOTIFICATIONS] Test notification sent');
    } catch (error) {
      console.error('[NOTIFICATIONS] Failed to send test notification:', error);
      throw error;
    }
  }

  // Helper functions

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  get subscribed(): boolean {
    return this.isSubscribed;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
