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
  id: number;
  hostname: string;
  scan_type: string;
  status: 'completed' | 'running' | 'failed';
  started_at: string;
  completed_at: string | null;
  duration: number | null;
  files_scanned: number;
  threats_found: number;
  scan_result: string;
  signature_version: string | null;
  engine_version: string | null;
  initiated_by: string | null;
  // UI compatibility
  timestamp?: string;
  alertsFound?: number;
  scanType?: string;
}

export interface RootkitAlert {
  id: number;
  scan_id: number;
  hostname: string;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  threat_name: string;
  file_path: string | null;
  description: string | null;
  remediation: string | null;
  status: 'active' | 'resolved' | 'ignored';
  detected_at: string;
  resolved_at: string | null;
  // UI compatibility  
  eventType?: string;
  detectionMethod?: string;
  recommendation?: string;
  details?: string;
  timestamp?: string;
  scanId?: string;
}

export interface RootkitStats {
  total_scans: number;
  active_alerts: number;
  resolved_alerts: number;
  last_scan: string | null;
  threat_types: Record<string, number>;
  severity_distribution: Record<string, number>;
  scan_success_rate: number;
  avg_scan_duration: number | null;
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