import axios from 'axios';
import { Snapshot, Event, Alert, EndpointDetail, ResilienceScore, ResilienceMetrics, ResilienceDashboard, Incident, IncidentStats } from '../types';

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

export const snapshotService = {
  getSnapshots: async (): Promise<Snapshot[]> => {
    const response = await api.get<Snapshot[]>('/snapshots');
    return response.data;
  },
};

export const eventService = {
  getEvents: async (): Promise<Event[]> => {
    const response = await api.get<Event[]>('/events');
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
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },
  
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default api;
