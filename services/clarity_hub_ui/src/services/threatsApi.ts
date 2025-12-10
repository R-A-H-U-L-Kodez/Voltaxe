import axios from 'axios';
import { Alert } from '../types';

// Create API client for threats service
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

export interface ThreatStats {
  totalThreats: number;
  criticalThreats: number;
  generalAlerts: number;
  rootkitAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
}

export interface RootkitAlert {
  id: number;
  scan_id: number;
  hostname: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threat_name: string;
  file_path: string;
  description: string;
  remediation: string;
  status: 'active' | 'resolved' | 'ignored';
  detected_at: string;
  resolved_at?: string;
}

export interface ThreatOverview {
  generalAlerts: Alert[];
  rootkitAlerts: RootkitAlert[];
  stats: ThreatStats;
}

class ThreatsService {
  /**
   * Get combined threat statistics including general alerts and rootkit alerts
   */
  async getStats(): Promise<ThreatStats> {
    try {
      // Fetch general alerts count
      const generalAlertsResponse = await apiClient.get<Alert[]>('/alerts', {
        params: { limit: 1000 } // Get all for accurate count
      });
      const generalAlerts = generalAlertsResponse.data;
      
      // Fetch rootkit stats
      const rootkitStatsResponse = await apiClient.get('/rootkit/stats');
      const rootkitStats = rootkitStatsResponse.data;
      
      // Calculate combined statistics
      const generalActiveCount = generalAlerts.filter((alert: Alert) => alert.status === 'new').length;
      const generalCriticalCount = generalAlerts.filter((alert: Alert) => alert.severity === 'critical').length;
      const rootkitActiveCount = rootkitStats.activeAlerts;
      const rootkitCriticalCount = rootkitStats.severityDistribution?.critical || 0;
      
      const stats: ThreatStats = {
        totalThreats: generalAlerts.length + (rootkitStats.activeAlerts + rootkitStats.resolvedAlerts),
        criticalThreats: generalCriticalCount + rootkitCriticalCount,
        generalAlerts: generalAlerts.length,
        rootkitAlerts: rootkitStats.activeAlerts + rootkitStats.resolvedAlerts,
        activeAlerts: generalActiveCount + rootkitActiveCount,
        resolvedAlerts: rootkitStats.resolvedAlerts
      };
      
      return stats;
    } catch (error) {
      console.error('Failed to fetch threat statistics:', error);
      return {
        totalThreats: 0,
        criticalThreats: 0,
        generalAlerts: 0,
        rootkitAlerts: 0,
        activeAlerts: 0,
        resolvedAlerts: 0
      };
    }
  }

  /**
   * Get overview of all threats (general alerts + rootkit alerts)
   */
  async getThreatsOverview(): Promise<ThreatOverview> {
    try {
      // Fetch general alerts
      const generalAlertsResponse = await apiClient.get<Alert[]>('/alerts');
      const generalAlerts = generalAlertsResponse.data;
      
      // Fetch rootkit alerts
      const rootkitAlertsResponse = await apiClient.get<RootkitAlert[]>('/rootkit/alerts');
      const rootkitAlerts = rootkitAlertsResponse.data;
      
      // Get combined stats
      const stats = await this.getStats();
      
      return {
        generalAlerts,
        rootkitAlerts,
        stats
      };
    } catch (error) {
      console.error('Failed to fetch threats overview:', error);
      return {
        generalAlerts: [],
        rootkitAlerts: [],
        stats: {
          totalThreats: 0,
          criticalThreats: 0,
          generalAlerts: 0,
          rootkitAlerts: 0,
          activeAlerts: 0,
          resolvedAlerts: 0
        }
      };
    }
  }

  /**
   * Get general alerts only
   */
  async getGeneralAlerts(params?: {
    search?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Alert[]> {
    const response = await apiClient.get<Alert[]>('/alerts', { params });
    return response.data;
  }

  /**
   * Get rootkit alerts only
   */
  async getRootkitAlerts(params?: {
    hostname?: string;
    severity?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<RootkitAlert[]> {
    const response = await apiClient.get<RootkitAlert[]>('/rootkit/alerts', { params });
    return response.data;
  }

  /**
   * Acknowledge a general alert
   */
  async acknowledgeGeneralAlert(alertId: string): Promise<void> {
    await apiClient.patch(`/alerts/${alertId}/acknowledge`);
  }

  /**
   * Resolve a rootkit alert
   */
  async resolveRootkitAlert(alertId: number): Promise<void> {
    await apiClient.patch(`/rootkit/alerts/${alertId}/resolve`);
  }

  /**
   * Trigger a manual rootkit scan
   */
  async triggerRootkitScan(hostname: string): Promise<{ status: string; message: string; scan_id?: number }> {
    const response = await apiClient.post('/rootkit/scan', { hostname });
    return response.data;
  }
}

export const threatsService = new ThreatsService();