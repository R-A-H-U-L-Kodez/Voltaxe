import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Clock, Activity, ChevronDown, ChevronUp, TrendingUp, Users, Target } from 'lucide-react';
import { incidentService } from '../services/api';

interface Alert {
  id: number;
  event_type: string;
  hostname: string;
  details: string;
  timestamp: string;
  severity: string;
}

interface Incident {
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
  alerts: Alert[];
  kill_chain_stage: string;
  recommended_actions: string[];
}

interface IncidentStats {
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

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [timeWindow, setTimeWindow] = useState<number>(24);

  useEffect(() => {
    fetchIncidents();
    fetchStats();
    const interval = setInterval(() => {
      fetchIncidents();
      fetchStats();
    }, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [filterSeverity, timeWindow]);

  const fetchIncidents = async () => {
    try {
      const data = await incidentService.getIncidents({
        severity: filterSeverity || undefined,
        hours: timeWindow,
      });
      setIncidents(data.incidents || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await incidentService.getIncidentStats(timeWindow);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'border-red-500 bg-red-500/10 text-red-400';
      case 'high':
        return 'border-orange-500 bg-orange-500/10 text-orange-400';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/10 text-yellow-400';
      case 'low':
        return 'border-blue-500 bg-blue-500/10 text-blue-400';
      default:
        return 'border-gray-500 bg-gray-500/10 text-gray-400';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const toggleIncident = (incidentId: string) => {
    setExpandedIncident(expandedIncident === incidentId ? null : incidentId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          <h1 className="text-4xl font-bold text-gradient-gold">Security Incidents</h1>
        </div>
        <p className="text-gray-400">Automatically correlated security events grouped into unified incidents</p>
      </div>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 border border-yellow-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Alert Reduction</div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gradient-gold">{stats.alert_reduction_percent}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.total_alerts} alerts → {stats.total_incidents} incidents
            </div>
          </div>

          <div className="bg-gray-800/50 border border-yellow-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Total Incidents</div>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-gradient-gold">{stats.total_incidents}</div>
            <div className="text-xs text-gray-500 mt-1">
              Avg {stats.avg_alerts_per_incident} alerts/incident
            </div>
          </div>

          <div className="bg-gray-800/50 border border-yellow-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Critical Incidents</div>
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-400">
              {stats.severity_distribution?.critical || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              High: {stats.severity_distribution?.high || 0}
            </div>
          </div>

          <div className="bg-gray-800/50 border border-yellow-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Multi-Host Attacks</div>
              <Users className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-orange-400">{stats.multi_host_incidents || 0}</div>
            <div className="text-xs text-gray-500 mt-1">
              Lateral movement detected
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={timeWindow}
          onChange={(e) => setTimeWindow(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200"
        >
          <option value={1}>Last Hour</option>
          <option value={6}>Last 6 Hours</option>
          <option value={24}>Last 24 Hours</option>
          <option value={72}>Last 3 Days</option>
          <option value={168}>Last Week</option>
        </select>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {incidents.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
            <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-300 mb-2">No Incidents Detected</h3>
            <p className="text-gray-500">All systems are operating normally</p>
          </div>
        ) : (
          incidents.map((incident) => (
            <div
              key={incident.incident_id}
              className={`border-2 rounded-lg overflow-hidden transition-all ${getSeverityColor(incident.severity)}`}
            >
              {/* Incident Header */}
              <div
                className="p-6 cursor-pointer hover:bg-white/5"
                onClick={() => toggleIncident(incident.incident_id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-200">{incident.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityBadgeColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{incident.description}</p>
                  </div>
                  <div className="ml-4">
                    {expandedIncident === incident.incident_id ? (
                      <ChevronUp className="h-6 w-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">Alert Count</div>
                    <div className="font-bold text-gray-300">{incident.alert_count}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Affected Hosts</div>
                    <div className="font-bold text-gray-300">{incident.affected_hosts.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Kill Chain Stage</div>
                    <div className="font-bold text-gray-300">{incident.kill_chain_stage}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Duration</div>
                    <div className="font-bold text-gray-300">
                      {Math.round(
                        (new Date(incident.last_seen).getTime() - new Date(incident.first_seen).getTime()) / 60000
                      )} min
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedIncident === incident.incident_id && (
                <div className="border-t border-current/20 bg-black/30 p-6">
                  {/* Affected Hosts */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-gray-300 mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Affected Hosts
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {incident.affected_hosts.map((host, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm"
                        >
                          {host}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Event Types */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-gray-300 mb-3 flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Event Types
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {incident.event_types.map((type, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Actions */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-gray-300 mb-3 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Recommended Actions
                    </h4>
                    <ul className="space-y-2">
                      {incident.recommended_actions.map((action, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 bg-gray-800/50 border border-gray-700 rounded-lg p-3"
                        >
                          <div className="text-yellow-500 mt-0.5">•</div>
                          <div className="text-gray-300 text-sm flex-1">{action}</div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-300 mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Alert Timeline ({incident.alerts.length} alerts)
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {incident.alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-start gap-3 bg-gray-800/30 border border-gray-700/50 rounded-lg p-3 text-sm"
                        >
                          <div className="text-gray-500 min-w-[140px]">
                            {formatTimestamp(alert.timestamp)}
                          </div>
                          <div className="text-yellow-400 min-w-[150px]">{alert.event_type}</div>
                          <div className="text-gray-400 min-w-[100px]">{alert.hostname}</div>
                          <div className="text-gray-500 flex-1 truncate">{alert.details}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
