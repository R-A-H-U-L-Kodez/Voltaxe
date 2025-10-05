import React, { useState, useEffect } from 'react';
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
  Calendar,
  User,
  AlertTriangle,
  CheckCircle
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

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      warning: 'bg-orange-100 text-orange-800 border-orange-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    const icons = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colors[severity as keyof typeof colors] || colors.info}`}>
        <span>{icons[severity as keyof typeof icons] || icons.info}</span>
        {severity.toUpperCase()}
      </span>
    );
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="text-green-600" size={16} />
    ) : (
      <AlertTriangle className="text-red-600" size={16} />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Audit Logs
              </h1>
              <p className="mt-2 text-gray-600">
                Complete audit trail of all actions within Voltaxe platform
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('json')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download size={18} />
                Export JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Logs (30d)</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics.total_logs}</p>
                </div>
                <Activity className="text-blue-600" size={32} />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Users</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics.unique_users}</p>
                </div>
                <User className="text-green-600" size={32} />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Critical Events</p>
                  <p className="text-3xl font-bold text-red-600">{statistics.severity_counts.critical}</p>
                </div>
                <span className="text-4xl">🚨</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Failed Actions</p>
                  <p className="text-3xl font-bold text-orange-600">{statistics.failed_actions}</p>
                </div>
                <AlertTriangle className="text-orange-600" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search logs by username, action, or resource..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter size={18} />
                Filters
                {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action Type
                  </label>
                  <select
                    value={filters.action_type || ''}
                    onChange={(e) => setFilters({ ...filters, action_type: e.target.value || undefined, offset: 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={filters.severity || ''}
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value || undefined, offset: 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Severities</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resource Type
                  </label>
                  <select
                    value={filters.resource_type || ''}
                    onChange={(e) => setFilters({ ...filters, resource_type: e.target.value || undefined, offset: 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Resources</option>
                    <option value="endpoint">Endpoints</option>
                    <option value="alert">Alerts</option>
                    <option value="user">Users</option>
                    <option value="audit_log">Audit Logs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={filters.start_date || ''}
                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value || undefined, offset: 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={filters.end_date || ''}
                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value || undefined, offset: 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full justify-center"
                  >
                    <X size={18} />
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Activity size={48} className="mx-auto mb-4 text-gray-400" />
              <p>No audit logs found matching your criteria</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resource
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Calendar className="text-gray-400" size={14} />
                            {auditService.formatTimestamp(log.timestamp)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="text-gray-400" size={14} />
                            <span className="text-sm font-medium text-gray-900">
                              {log.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{log.action_description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {auditService.getActionTypeLabel(log.action_type)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.resource_type && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100">
                              {log.resource_type}: {log.resource_id || 'N/A'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getSeverityBadge(log.severity)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusIcon(log.success)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(filters.offset || 0) + 1} to {Math.min((filters.offset || 0) + logs.length, totalLogs)} of {totalLogs} logs
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={!filters.offset || filters.offset === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={(filters.offset || 0) + logs.length >= totalLogs}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Audit Log Details</h2>
                    <p className="text-sm text-gray-500 mt-1">ID: {selectedLog.id}</p>
                  </div>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                    <p className="text-gray-900">{auditService.formatTimestamp(selectedLog.timestamp)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                      <p className="text-gray-900">{selectedLog.username}</p>
                      <p className="text-xs text-gray-500">ID: {selectedLog.user_id}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                      {getSeverityBadge(selectedLog.severity)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                    <p className="text-gray-900">{auditService.getActionTypeLabel(selectedLog.action_type)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900">{selectedLog.action_description}</p>
                  </div>

                  {selectedLog.resource_type && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                        <p className="text-gray-900">{selectedLog.resource_type}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Resource ID</label>
                        <p className="text-gray-900">{selectedLog.resource_id || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedLog.success)}
                      <span className={selectedLog.success ? 'text-green-600' : 'text-red-600'}>
                        {selectedLog.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                  </div>

                  {selectedLog.error_message && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Error Message</label>
                      <p className="text-red-600 bg-red-50 p-3 rounded-lg">{selectedLog.error_message}</p>
                    </div>
                  )}

                  {selectedLog.ip_address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                      <p className="text-gray-900 font-mono">{selectedLog.ip_address}</p>
                    </div>
                  )}

                  {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                      <pre className="bg-gray-50 p-3 rounded-lg overflow-x-auto text-xs">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
