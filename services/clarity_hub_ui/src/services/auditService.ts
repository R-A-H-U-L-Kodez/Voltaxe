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
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  private getAuthToken(): string | null {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('[AUDIT] No access token found');
      return null;
    }
    
    if (this.isTokenExpired(token)) {
      console.warn('[AUDIT] Token expired, clearing storage and redirecting');
      localStorage.clear();
      window.location.href = '/login';
      return null;
    }
    
    return token;
  }

  private getHeaders(): HeadersInit {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No valid authentication token');
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
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
    console.log('exportLogs called with:', { startDate, endDate, format });
    
    try {
      // Try backend API first
      const params = new URLSearchParams({ format });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      console.log('Attempting backend API export...');
      const response = await fetch(
        `${API_BASE_URL}/audit/export?${params.toString()}`,
        {
          headers: this.getHeaders()
        }
      );

      if (response.ok) {
        console.log('Backend export succeeded');
        return response.blob();
      }
      console.log('Backend export failed:', response.status, response.statusText);
    } catch (error) {
      console.warn('Backend export unavailable, using client-side export:', error);
    }

    // Fallback: Client-side export
    console.log('Using client-side export fallback');
    
    // Fetch all logs with date filters
    const filters: AuditFilters = {
      limit: 10000, // Large limit to get all logs
      offset: 0
    };
    if (startDate) filters.start_date = startDate;
    if (endDate) filters.end_date = endDate;

    console.log('Fetching logs with filters:', filters);
    const logsData = await this.getAuditLogs(filters);
    const logs = logsData.logs;
    console.log('Retrieved logs count:', logs.length);

    if (format === 'json') {
      // JSON export
      console.log('Creating JSON export');
      const jsonString = JSON.stringify(logs, null, 2);
      return new Blob([jsonString], { type: 'application/json' });
    } else {
      // CSV export
      console.log('Creating CSV export');
      const headers = [
        'ID',
        'Timestamp',
        'User ID',
        'Username',
        'Action Type',
        'Action Description',
        'Severity',
        'Resource Type',
        'Resource ID',
        'IP Address',
        'Success',
        'Error Message'
      ];

      const csvRows = [headers.join(',')];

      logs.forEach(log => {
        const row = [
          log.id,
          log.timestamp,
          log.user_id,
          log.username,
          log.action_type,
          `"${(log.action_description || '').replace(/"/g, '""')}"`,
          log.severity,
          log.resource_type || '',
          log.resource_id || '',
          log.ip_address || '',
          log.success ? 'true' : 'false',
          `"${(log.error_message || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');
      console.log('CSV export created, size:', csvString.length, 'characters');
      return new Blob([csvString], { type: 'text/csv' });
    }
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
