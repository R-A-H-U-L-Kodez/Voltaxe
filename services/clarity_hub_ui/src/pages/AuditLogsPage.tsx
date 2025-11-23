import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import {
  auditService,
  AuditLog,
  AuditStatistics,
  AuditFilters
} from '../services/auditService';
import {
  Activity,
  Filter,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  User,
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock
} from 'lucide-react';

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>({
    limit: 50,
    offset: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalLogs, setTotalLogs] = useState(0);

  useEffect(() => {
    fetchAuditLogs();
    fetchStatistics();
    fetchActionTypes();
  }, [filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await auditService.getAuditLogs(filters);
      setLogs(response.logs);
      setTotalLogs(response.total);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await auditService.getStatistics(30);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const fetchActionTypes = async () => {
    try {
      const types = await auditService.getActionTypes();
      setActionTypes(types.action_types);
    } catch (error) {
      console.error('Failed to fetch action types:', error);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm, offset: 0 });
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const blob = await auditService.exportLogs(
        filters.start_date,
        filters.end_date,
        format
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const clearFilters = () => {
    setFilters({ limit: 50, offset: 0 });
    setSearchTerm('');
  };

  const handlePreviousPage = () => {
    if (filters.offset && filters.offset > 0) {
      setFilters({
        ...filters,
        offset: Math.max(0, (filters.offset || 0) - (filters.limit || 50))
      });
    }
  };

  const handleNextPage = () => {
    setFilters({
      ...filters,
      offset: (filters.offset || 0) + (filters.limit || 50)
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'hsl(var(--danger) / 0.1)',
          text: 'hsl(var(--danger))',
          border: 'hsl(var(--danger) / 0.3)'
        };
      case 'warning':
        return {
          bg: 'hsl(var(--warning) / 0.1)',
          text: 'hsl(var(--warning))',
          border: 'hsl(var(--warning) / 0.3)'
        };
      default:
        return {
          bg: 'hsl(var(--primary-gold) / 0.1)',
          text: 'hsl(var(--primary-gold))',
          border: 'hsl(var(--primary-gold) / 0.3)'
        };
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = getSeverityColor(severity);
    return (
      <span 
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`
        }}
      >
        {severity.toUpperCase()}
      </span>
    );
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />
    ) : (
      <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(var(--danger))' }} />
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 gradient-gold rounded-2xl flex items-center justify-center shadow-xl">
              <FileText size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient-gold">Audit Logs</h1>
              <p className="mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Complete audit trail of all platform activities
              </p>
            </div>
          </div>
          
          {/* Export Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth card hover-lift"
              style={{
                backgroundColor: 'hsl(var(--primary-gold) / 0.1)',
                color: 'hsl(var(--primary-gold))',
                border: '1px solid hsl(var(--primary-gold) / 0.3)'
              }}
            >
              <Download size={18} />
              Export JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth card hover-lift"
              style={{
                backgroundColor: 'hsl(var(--success) / 0.1)',
                color: 'hsl(var(--success))',
                border: '1px solid hsl(var(--success) / 0.3)'
              }}
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fadeIn">
            <div className="card p-6 hover-lift">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Logs (30d)</div>
                <Activity className="h-5 w-5" style={{ color: 'hsl(var(--primary-gold))' }} />
              </div>
              <div className="text-3xl font-bold text-gradient-gold">{statistics.total_logs}</div>
            </div>
            
            <div className="card p-6 hover-lift">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Active Users</div>
                <User className="h-5 w-5" style={{ color: 'hsl(var(--success))' }} />
              </div>
              <div className="text-3xl font-bold" style={{ color: 'hsl(var(--success))' }}>{statistics.unique_users}</div>
            </div>
            
            <div className="card p-6 hover-lift">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Critical Events</div>
                <AlertTriangle className="h-5 w-5" style={{ color: 'hsl(var(--danger))' }} />
              </div>
              <div className="text-3xl font-bold" style={{ color: 'hsl(var(--danger))' }}>{statistics.severity_counts.critical}</div>
            </div>
            
            <div className="card p-6 hover-lift">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Failed Actions</div>
                <X className="h-5 w-5" style={{ color: 'hsl(var(--warning))' }} />
              </div>
              <div className="text-3xl font-bold" style={{ color: 'hsl(var(--warning))' }}>{statistics.failed_actions}</div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="card p-6 mb-6 animate-fadeIn">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} size={20} />
                <input
                  type="text"
                  placeholder="Search logs by username, action, or resource..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 rounded-lg transition-smooth"
                  style={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                  }}
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-2 rounded-lg transition-smooth"
                style={{
                  backgroundColor: 'hsl(var(--primary-gold))',
                  color: 'white'
                }}
              >
                Search
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth"
                style={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))'
                }}
              >
                <Filter size={18} />
                Filters
                {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                    Action Type
                  </label>
                  <select
                    value={filters.action_type || ''}
                    onChange={(e) => setFilters({ ...filters, action_type: e.target.value || undefined, offset: 0 })}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))'
                    }}
                  >
                    <option value="">All Actions</option>
                    {actionTypes.map(type => (
                      <option key={type} value={type}>
                        {auditService.getActionTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                    Severity
                  </label>
                  <select
                    value={filters.severity || ''}
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value || undefined, offset: 0 })}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))'
                    }}
                  >
                    <option value="">All Severities</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                    Resource Type
                  </label>
                  <select
                    value={filters.resource_type || ''}
                    onChange={(e) => setFilters({ ...filters, resource_type: e.target.value || undefined, offset: 0 })}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))'
                    }}
                  >
                    <option value="">All Types</option>
                    <option value="user">User</option>
                    <option value="endpoint">Endpoint</option>
                    <option value="alert">Alert</option>
                    <option value="scan">Scan</option>
                  </select>
                </div>
              </div>
            )}

            {/* Active Filters */}
            {(filters.action_type || filters.severity || filters.resource_type || filters.search) && (
              <div className="flex flex-wrap gap-2 items-center pt-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                <span className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Active Filters:</span>
                {filters.action_type && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)', color: 'hsl(var(--primary-gold))' }}>
                    {auditService.getActionTypeLabel(filters.action_type)}
                    <X size={14} className="cursor-pointer" onClick={() => setFilters({ ...filters, action_type: undefined })} />
                  </span>
                )}
                {filters.severity && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)', color: 'hsl(var(--primary-gold))' }}>
                    {filters.severity}
                    <X size={14} className="cursor-pointer" onClick={() => setFilters({ ...filters, severity: undefined })} />
                  </span>
                )}
                {filters.resource_type && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)', color: 'hsl(var(--primary-gold))' }}>
                    {filters.resource_type}
                    <X size={14} className="cursor-pointer" onClick={() => setFilters({ ...filters, resource_type: undefined })} />
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ color: 'hsl(var(--danger))' }}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Logs Table */}
        <div className="card overflow-hidden animate-fadeIn">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4" style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--primary-gold))' }}></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center p-12">
              <FileText className="h-16 w-16 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>No audit logs found</h3>
              <p style={{ color: 'hsl(var(--muted-foreground))' }}>Try adjusting your filters or search criteria</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--border))' }}>
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Timestamp</th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>User</th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Action</th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Resource</th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Severity</th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="cursor-pointer transition-smooth"
                        style={{ 
                          backgroundColor: selectedLog?.id === log.id ? 'hsl(var(--primary-gold) / 0.1)' : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedLog?.id !== log.id) {
                            e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.5)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedLog?.id !== log.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            {log.username}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                          {auditService.getActionTypeLabel(log.action_type)}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          <div className="flex flex-col">
                            <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{log.resource_type}</span>
                            {log.resource_id && <span className="text-xs truncate max-w-xs">{log.resource_id}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getSeverityBadge(log.severity)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getStatusIcon(log.success)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Showing {(filters.offset || 0) + 1} to {Math.min((filters.offset || 0) + (filters.limit || 50), totalLogs)} of {totalLogs} logs
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={!filters.offset || filters.offset === 0}
                    className="px-4 py-2 rounded-lg transition-smooth"
                    style={{
                      backgroundColor: (!filters.offset || filters.offset === 0) ? 'hsl(var(--muted))' : 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      color: (!filters.offset || filters.offset === 0) ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
                      cursor: (!filters.offset || filters.offset === 0) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={(filters.offset || 0) + (filters.limit || 50) >= totalLogs}
                    className="px-4 py-2 rounded-lg transition-smooth"
                    style={{
                      backgroundColor: ((filters.offset || 0) + (filters.limit || 50) >= totalLogs) ? 'hsl(var(--muted))' : 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      color: ((filters.offset || 0) + (filters.limit || 50) >= totalLogs) ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
                      cursor: ((filters.offset || 0) + (filters.limit || 50) >= totalLogs) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Log Details Modal */}
        {selectedLog && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedLog(null)}
          >
            <div 
              className="card max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                <h2 className="text-2xl font-bold text-gradient-gold">Log Details</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 rounded-lg hover:bg-opacity-10"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Timestamp</p>
                    <p style={{ color: 'hsl(var(--foreground))' }}>{new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>User</p>
                    <p style={{ color: 'hsl(var(--foreground))' }}>{selectedLog.username}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Action</p>
                    <p style={{ color: 'hsl(var(--foreground))' }}>{auditService.getActionTypeLabel(selectedLog.action_type)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedLog.success)}
                      <span style={{ color: 'hsl(var(--foreground))' }}>{selectedLog.success ? 'Success' : 'Failed'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Severity</p>
                    {getSeverityBadge(selectedLog.severity)}
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>IP Address</p>
                    <p style={{ color: 'hsl(var(--foreground))' }}>{selectedLog.ip_address}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Resource</p>
                  <p style={{ color: 'hsl(var(--foreground))' }}>{selectedLog.resource_type}</p>
                  {selectedLog.resource_id && (
                    <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>ID: {selectedLog.resource_id}</p>
                  )}
                </div>

                {selectedLog.details && (
                  <div>
                    <p className="text-sm font-medium mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Details</p>
                    <pre 
                      className="p-4 rounded-lg text-sm overflow-x-auto"
                      style={{
                        backgroundColor: 'hsl(var(--muted))',
                        color: 'hsl(var(--foreground))'
                      }}
                    >
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.error_message && (
                  <div 
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: 'hsl(var(--danger) / 0.1)',
                      border: '1px solid hsl(var(--danger) / 0.3)'
                    }}
                  >
                    <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--danger))' }}>Error Message</p>
                    <p className="text-sm" style={{ color: 'hsl(var(--danger))' }}>{selectedLog.error_message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AuditLogsPage;
