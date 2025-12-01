import axios from 'axios';
import { Snapshot, Event, Alert, EndpointDetail, ResilienceScore, ResilienceMetrics, ResilienceDashboard, Incident, IncidentStats, Endpoint, FleetMetrics, AuditLog, AuditLogFilters, AuditLogStats } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Separate axios instance for auth (no /api prefix)
const authApi = axios.create({
  baseURL: '/',
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

// Add request interceptor for authApi as well
authApi.interceptors.request.use(
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

export const snapshotService = {
  getSnapshots: async (): Promise<Snapshot[]> => {
    const response = await api.get<Snapshot[]>('/snapshots');
    return response.data;
  },
};

export const eventService = {
  getEvents: async (limit: number = 100, page: number = 1): Promise<Event[]> => {
    const response = await api.get<Event[]>('/events', {
      params: {
        limit,
        offset: (page - 1) * limit
      }
    });
    return response.data;
  },
  getEventsByHostname: async (hostname: string): Promise<Event[]> => {
    const response = await api.get<Event[]>(`/events?hostname=${hostname}`);
    return response.data;
  },
};

export const alertService = {
  getAlerts: async (params?: {
    severity?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Alert[]> => {
    const response = await api.get<Alert[]>('/alerts', { params });
    return response.data;
  },
  acknowledgeAlert: async (alertId: string): Promise<void> => {
    await api.patch(`/alerts/${alertId}/acknowledge`);
  },
};

export const endpointService = {
  getEndpointDetail: async (hostname: string): Promise<EndpointDetail> => {
    const response = await api.get<EndpointDetail>(`/endpoints/${hostname}`);
    return response.data;
  },
  scanEndpoint: async (hostname: string): Promise<{ status: string; message: string }> => {
    const response = await api.post(`/endpoints/${hostname}/scan`);
    return response.data;
  },
  isolateEndpoint: async (hostname: string): Promise<{ status: string; message: string }> => {
    console.log('[ISOLATE] Starting isolation for:', hostname);
    console.log('[ISOLATE] Token from localStorage:', localStorage.getItem('token')?.substring(0, 20) + '...');
    const response = await api.post(`/endpoints/${hostname}/isolate`);
    console.log('[ISOLATE] Response:', response);
    return response.data;
  },
  
  // Fleet Management methods
  getAllEndpoints: async (params?: {
    status?: string;
    risk_level?: string;
    os_type?: string;
    search?: string;
  }): Promise<Endpoint[]> => {
    const response = await api.get<Endpoint[]>('/fleet/endpoints', { params });
    return response.data;
  },
  
  getFleetMetrics: async (): Promise<FleetMetrics> => {
    const response = await api.get<FleetMetrics>('/fleet/metrics');
    return response.data;
  },
  
  getEndpoint: async (endpointId: string): Promise<Endpoint> => {
    const response = await api.get<Endpoint>(`/fleet/endpoints/${endpointId}`);
    return response.data;
  },
  
  quickScan: async (hostname: string, scanType: 'vulnerability' | 'malware' | 'full' = 'vulnerability'): Promise<{ status: string; message: string }> => {
    const response = await api.post<{ status: string; message: string }>(`/endpoints/${hostname}/scan`, { scan_type: scanType });
    return response.data;
  },
  
  restoreEndpoint: async (hostname: string): Promise<{ status: string; message: string }> => {
    const response = await api.post<{ status: string; message: string }>(`/endpoints/${hostname}/restore`);
    return response.data;
  },
  
  updateEndpoint: async (endpointId: string, data: Partial<Endpoint>): Promise<Endpoint> => {
    const response = await api.patch<Endpoint>(`/fleet/endpoints/${endpointId}`, data);
    return response.data;
  },
};

export const vulnerabilityService = {
  getCVEDetails: async (cveId: string): Promise<any> => {
    const response = await api.get(`/vulnerabilities/${cveId}`);
    return response.data;
  },
};

export const resilienceService = {
  getResilienceScores: async (): Promise<ResilienceScore[]> => {
    const response = await api.get<ResilienceScore[]>('/resilience/scores');
    return response.data;
  },
  getResilienceMetrics: async (limit: number = 50): Promise<ResilienceMetrics[]> => {
    const response = await api.get<ResilienceMetrics[]>(`/resilience/metrics?limit=${limit}`);
    return response.data;
  },
  getResilienceDashboard: async (): Promise<ResilienceDashboard> => {
    const response = await api.get<ResilienceDashboard>('/resilience/dashboard');
    return response.data;
  },
};

export const incidentService = {
  getIncidents: async (params?: {
    status?: string;
    severity?: string;
    hours?: number;
    limit?: number;
  }): Promise<{ incidents: Incident[] }> => {
    const response = await api.get<{ incidents: Incident[] }>('/incidents/', { params });
    return response.data;
  },
  getIncidentDetails: async (incidentId: string): Promise<Incident> => {
    const response = await api.get<Incident>(`/incidents/${incidentId}`);
    return response.data;
  },
  getIncidentStats: async (hours: number = 24): Promise<IncidentStats> => {
    const response = await api.get<IncidentStats>('/incidents/stats/summary', { params: { hours } });
    return response.data;
  },
  updateIncidentStatus: async (incidentId: string, status: string): Promise<Incident> => {
    const response = await api.patch<Incident>(`/incidents/${incidentId}/status`, { status });
    return response.data;
  },
  assignIncident: async (incidentId: string, assignee: string): Promise<Incident> => {
    const response = await api.patch<Incident>(`/incidents/${incidentId}/assign`, { assigned_to: assignee });
    return response.data;
  },
  addComment: async (incidentId: string, content: string): Promise<any> => {
    const response = await api.post(`/incidents/${incidentId}/comments`, { content });
    return response.data;
  },
  getTeamMembers: async (): Promise<{ id: string; name: string; email: string }[]> => {
    const response = await api.get('/team/members');
    return response.data;
  },
};

// Auth Service
export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    role: string;
    full_name?: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  created_at?: string;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await authApi.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await authApi.post('/auth/register', userData);
    return response.data;
  },
  
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await authApi.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },
  
  getProfile: async (): Promise<UserProfile> => {
    const response = await authApi.get('/auth/me');
    return response.data;
  },
};

// Audit Logs Service
// Helper function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Helper function to get valid token or redirect to login
const getValidToken = (): string | null => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.warn('[AUTH] No access token found');
    return null;
  }
  
  if (isTokenExpired(token)) {
    console.warn('[AUTH] Token expired, clearing and redirecting to login');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
    return null;
  }
  
  return token;
};

export const auditService = {
  getAuditLogs: async (filters?: AuditLogFilters): Promise<{ logs: AuditLog[]; total: number }> => {
    const token = getValidToken();
    if (!token) throw new Error('No valid authentication token');
    
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await fetch(`/api/audit/logs?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  getAuditLogStats: async (days: number = 30): Promise<AuditLogStats> => {
    const token = getValidToken();
    if (!token) throw new Error('No valid authentication token');
    
    const response = await fetch(`/api/audit/statistics?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch audit statistics: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  exportAuditLogs: async (format: 'csv' | 'json', filters?: AuditLogFilters): Promise<Blob> => {
    const token = getValidToken();
    if (!token) throw new Error('No valid authentication token');
    
    const params = new URLSearchParams({ format });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await fetch(`/api/audit/export?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to export audit logs: ${response.statusText}`);
    }
    
    return response.blob();
  },
  
  getActionTypes: async (): Promise<{ action_types: string[]; severity_levels: string[] }> => {
    const token = getValidToken();
    if (!token) throw new Error('No valid authentication token');
    
    const response = await fetch('/api/audit/action-types', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch action types: ${response.statusText}`);
    }
    
    return response.json();
  },
};

export const axonService = {
  /**
   * 🚨 PANIC BUTTON: Manually trigger ML model retraining
   * 
   * Use this when:
   * - You installed new legitimate software and it's being flagged
   * - False positive rate is too high
   * - Need to incorporate recent data immediately
   */
  retrainModel: async (): Promise<{ 
    status: string; 
    message: string; 
    estimated_completion: string;
    triggered_by: string;
    timestamp: string;
    note: string;
  }> => {
    const response = await api.post('/axon/retrain');
    return response.data;
  },
  
  /**
   * Get Axon Engine performance metrics
   */
  getMetrics: async (): Promise<any> => {
    const response = await api.get('/axon/metrics');
    return response.data;
  },
};

export default api;
