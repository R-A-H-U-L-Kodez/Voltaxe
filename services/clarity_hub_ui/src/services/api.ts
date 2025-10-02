import axios from 'axios';
import { Snapshot, Event, Alert, EndpointDetail } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    const response = await api.post(`/endpoints/${hostname}/isolate`);
    return response.data;
  },
};

export const vulnerabilityService = {
  getCVEDetails: async (cveId: string): Promise<any> => {
    const response = await api.get(`/vulnerabilities/${cveId}`);
    return response.data;
  },
};

export default api;
