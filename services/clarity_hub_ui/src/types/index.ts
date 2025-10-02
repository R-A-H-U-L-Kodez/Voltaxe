export interface Snapshot {
  id: string;
  hostname: string;
  os: string;
  timestamp: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export type EventType = 'VULNERABILITY_DETECTED' | 'SUSPICIOUS_PARENT_CHILD' | 'NEW_PROCESS_DETECTED';

export interface Event {
  id: string;
  type: EventType;
  hostname: string;
  details: string;
  timestamp: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'new' | 'acknowledged';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  timestamp: string;
  hostname: string;
  details: string;
  status: AlertStatus;
  eventType: EventType;
}

export interface HardwareInfo {
  cpu: string;
  ram: string;
  disk: string;
  gpu?: string;
}

export interface InstalledSoftware {
  id: string;
  name: string;
  version: string;
  publisher?: string;
  installDate?: string;
}

export interface EndpointDetail {
  hostname: string;
  os: string;
  lastSeen: string;
  status: 'online' | 'offline';
  hardware: HardwareInfo;
  software: InstalledSoftware[];
  events: Event[];
}
