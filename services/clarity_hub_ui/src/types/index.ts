export interface Snapshot {
  id: string;
  hostname: string;
  os: string;
  timestamp: string;
  resilience_score?: number;
  risk_category?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  last_scored?: string;
}

export interface ResilienceScore {
  hostname: string;
  resilience_score: number | null;
  risk_category: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
  last_scored: string | null;
  vulnerability_count?: number;
  suspicious_events_count?: number;
}

export interface ResilienceMetrics {
  hostname: string;
  resilience_score: number;
  risk_category: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  vulnerability_count: number;
  suspicious_events_count: number;
  critical_vulnerabilities: number;
  high_vulnerabilities: number;
  medium_vulnerabilities: number;
  low_vulnerabilities: number;
  timestamp: string;
  score_details?: any;
}

export interface ResilienceDashboard {
  summary: {
    total_endpoints: number;
    average_score: number;
    risk_distribution: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
      CRITICAL: number;
    };
  };
  recent_scores: ResilienceScore[];
  score_trend: Array<{
    hostname: string;
    score: number;
    timestamp: string | null;
  }>;
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

// Incident-related interfaces
export interface IncidentAlert {
  id: number;
  event_type: string;
  hostname: string;
  details: string;
  timestamp: string;
  severity: string;
}

export interface Incident {
  incident_id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  alert_count: number;
  affected_hosts: string[];
  event_types: string[];
  first_seen: string;
  last_seen: string;
  alerts: IncidentAlert[];
  kill_chain_stage: string;
  recommended_actions: string[];
}

export interface IncidentStats {
  total_alerts: number;
  total_incidents: number;
  alert_reduction_percent: number;
  avg_alerts_per_incident: number;
  severity_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  kill_chain_stages: Record<string, number>;
  multi_host_incidents: number;
  time_window_hours: number;
}
