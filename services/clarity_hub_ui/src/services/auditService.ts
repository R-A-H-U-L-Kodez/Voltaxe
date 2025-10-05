/**
 * Voltaxe Audit Logging Service
 * Frontend service for retrieving and displaying audit logs
 */

const API_BASE_URL = 'http://localhost:8000';

export interface AuditLog {
  id: number;
  timestamp: string;
  user_id: string;
  username: string;
  action_type: string;
  action_description: string;
  severity: 'info' | 'warning' | 'critical';
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  success: boolean;
  error_message?: string;
}

export interface AuditStatistics {
  period_days: number;
  total_logs: number;
  unique_users: number;
  failed_actions: number;
  action_types: Record<string, number>;
  severity_counts: {
    info: number;
    warning: number;
    critical: number;
  };
  resource_types: Record<string, number>;
}

export interface UserActivity {
  user_id: string;
  period_days: number;
  total_actions: number;
  failed_actions: number;
  action_types: Record<string, number>;
  severity_counts: {
    info: number;
    warning: number;
    critical: number;
  };
  last_activity?: string;
}

export interface AuditFilters {
  user_id?: string;
  action_type?: string;
  resource_type?: string;
  resource_id?: string;
  severity?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

class AuditService {
  private getAuthToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async getAuditLogs(filters: AuditFilters = {}): Promise<{
    logs: AuditLog[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(
      `${API_BASE_URL}/audit/logs?${params.toString()}`,
      {
        headers: this.getHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
    }

    return response.json();
  }

  async getAuditLogDetail(logId: number): Promise<AuditLog> {
    const response = await fetch(`${API_BASE_URL}/audit/logs/${logId}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audit log detail: ${response.statusText}`);
    }

    return response.json();
  }

  async getStatistics(days: number = 30): Promise<AuditStatistics> {
    const response = await fetch(
      `${API_BASE_URL}/audit/statistics?days=${days}`,
      {
        headers: this.getHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch audit statistics: ${response.statusText}`);
    }

    return response.json();
  }

  async getUserActivity(userId: string, days: number = 30): Promise<UserActivity> {
    const response = await fetch(
      `${API_BASE_URL}/audit/user-activity/${userId}?days=${days}`,
      {
        headers: this.getHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch user activity: ${response.statusText}`);
    }

    return response.json();
  }

  async exportLogs(
    startDate?: string,
    endDate?: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<Blob> {
    const params = new URLSearchParams({ format });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await fetch(
      `${API_BASE_URL}/audit/export?${params.toString()}`,
      {
        headers: this.getHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to export audit logs: ${response.statusText}`);
    }

    return response.blob();
  }

  async getActionTypes(): Promise<{
    action_types: string[];
    severity_levels: string[];
  }> {
    const response = await fetch(`${API_BASE_URL}/audit/action-types`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch action types: ${response.statusText}`);
    }

    return response.json();
  }

  // Utility functions
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-orange-600 bg-orange-50';
      case 'info':
      default:
        return 'text-blue-600 bg-blue-50';
    }
  }

  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  }

  getActionTypeLabel(actionType: string): string {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

export const auditService = new AuditService();
