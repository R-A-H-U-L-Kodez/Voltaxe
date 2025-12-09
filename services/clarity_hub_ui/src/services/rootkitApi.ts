import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
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

export interface RootkitScan {
  id: string;
  hostname: string;
  timestamp: string;
  status: 'completed' | 'running' | 'failed';
  duration: number; // in milliseconds
  alertsFound: number;
  scanType: 'manual' | 'scheduled';
  details?: string;
}

export interface RootkitAlert {
  id: string;
  hostname: string;
  eventType: string;
  detectionMethod: string;
  recommendation: string;
  details: string;
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  scanId: string;
  status: 'active' | 'investigating' | 'resolved';
}

export interface RootkitStats {
  totalScans: number;
  scansToday: number;
  lastScanTime: string | null;
  nextScheduledScan: string | null;
  totalAlertsFound: number;
  activeAlerts: number;
  resolvedAlerts: number;
  scanningEnabled: boolean;
  scanInterval: string; // e.g., "6h", "1h", "30m"
  cleanSystems: number;
  infectedSystems: number;
}

export const rootkitService = {
  // Get rootkit scan history
  getScans: async (limit: number = 50): Promise<RootkitScan[]> => {
    const response = await api.get<RootkitScan[]>('/rootkit/scans', {
      params: { limit }
    });
    return response.data;
  },

  // Get rootkit alerts
  getAlerts: async (params?: {
    status?: string;
    severity?: string;
    hostname?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<RootkitAlert[]> => {
    const response = await api.get<RootkitAlert[]>('/rootkit/alerts', { params });
    return response.data;
  },

  // Get rootkit statistics
  getStats: async (): Promise<RootkitStats> => {
    const response = await api.get<RootkitStats>('/rootkit/stats');
    return response.data;
  },

  // Trigger manual rootkit scan
  triggerManualScan: async (hostname?: string): Promise<{ 
    scanId: string; 
    status: string; 
    message: string; 
  }> => {
    const response = await api.post('/rootkit/scan', { hostname });
    return response.data;
  },

  // Get scan status
  getScanStatus: async (scanId: string): Promise<{
    id: string;
    status: 'running' | 'completed' | 'failed';
    progress: number; // 0-100
    message: string;
    alertsFound: number;
  }> => {
    const response = await api.get(`/rootkit/scans/${scanId}/status`);
    return response.data;
  },

  // Update alert status
  updateAlertStatus: async (alertId: string, status: 'investigating' | 'resolved'): Promise<void> => {
    await api.patch(`/rootkit/alerts/${alertId}`, { status });
  },

  // Get rootkit scan configuration
  getConfig: async (): Promise<{
    daemonMode: boolean;
    scanInterval: string;
    enableChkrootkit: boolean;
    enableRkhunter: boolean;
    enableMemoryAnalysis: boolean;
    enableNetworkScan: boolean;
    verboseOutput: boolean;
  }> => {
    const response = await api.get('/rootkit/config');
    return response.data;
  },

  // Update rootkit scan configuration
  updateConfig: async (config: {
    daemonMode?: boolean;
    scanInterval?: string;
    enableChkrootkit?: boolean;
    enableRkhunter?: boolean;
    enableMemoryAnalysis?: boolean;
    enableNetworkScan?: boolean;
    verboseOutput?: boolean;
  }): Promise<void> => {
    await api.patch('/rootkit/config', config);
  },

  // Get live scan logs
  getScanLogs: async (scanId: string): Promise<string[]> => {
    const response = await api.get(`/rootkit/scans/${scanId}/logs`);
    return response.data;
  }
};