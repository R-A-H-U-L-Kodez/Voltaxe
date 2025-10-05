import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Clock, Activity, ChevronDown, ChevronUp, TrendingUp, Users, Target } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
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
      <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 gradient-gold rounded-2xl flex items-center justify-center shadow-xl">
              <Target size={32} style={{ color: 'hsl(var(--background))' }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient-gold">Security Incidents</h1>
              <p className="text-gray-400 mt-1">Automatically correlated security events grouped into unified incidents</p>
            </div>
          </div>
        </div>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fadeIn">
          <div className="card p-6 hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Alert Reduction</div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gradient-gold mb-1">{stats.alert_reduction_percent}%</div>
            <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {stats.total_alerts} alerts → {stats.total_incidents} incidents
            </div>
          </div>

          <div className="card p-6 hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Incidents</div>
              <AlertTriangle className="h-5 w-5" style={{ color: 'hsl(var(--primary-gold))' }} />
            </div>
            <div className="text-3xl font-bold text-gradient-gold mb-1">{stats.total_incidents}</div>
            <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Avg {stats.avg_alerts_per_incident} alerts/incident
            </div>
          </div>

          <div className="card p-6 hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Critical Incidents</div>
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-400 mb-1">
              {stats.severity_distribution?.critical || 0}
            </div>
            <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              High: {stats.severity_distribution?.high || 0}
            </div>
          </div>

          <div className="card p-6 hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Multi-Host Attacks</div>
              <Users className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-orange-400 mb-1">{stats.multi_host_incidents || 0}</div>
            <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Lateral movement detected
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6 animate-fadeIn">
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-4 py-2 rounded-lg border transition-smooth"
          style={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--foreground))'
          }}
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
          className="px-4 py-2 rounded-lg border transition-smooth"
          style={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--foreground))'
          }}
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
          <div className="card p-12 text-center animate-fadeIn">
            <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>No Incidents Detected</h3>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>All systems are operating normally</p>
          </div>
        ) : (
          incidents.map((incident) => (
            <div
              key={incident.incident_id}
              className="card overflow-hidden transition-all hover-lift animate-fadeIn"
            >
              {/* Incident Header */}
              <div
                className="p-6 cursor-pointer"
                onClick={() => toggleIncident(incident.incident_id)}
                style={{ backgroundColor: 'hsl(var(--card))' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{incident.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityBadgeColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{incident.description}</p>
                  </div>
                  <div className="ml-4">
                    {expandedIncident === incident.incident_id ? (
                      <ChevronUp className="h-6 w-6" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    ) : (
                      <ChevronDown className="h-6 w-6" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Alert Count</div>
                    <div className="font-bold" style={{ color: 'hsl(var(--foreground))' }}>{incident.alert_count}</div>
                  </div>
                  <div>
                    <div className="mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Affected Hosts</div>
                    <div className="font-bold" style={{ color: 'hsl(var(--foreground))' }}>{incident.affected_hosts.length}</div>
                  </div>
                  <div>
                    <div className="mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Kill Chain Stage</div>
                    <div className="font-bold" style={{ color: 'hsl(var(--foreground))' }}>{incident.kill_chain_stage}</div>
                  </div>
                  <div>
                    <div className="mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Duration</div>
                    <div className="font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                      {Math.round(
                        (new Date(incident.last_seen).getTime() - new Date(incident.first_seen).getTime()) / 60000
                      )} min
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedIncident === incident.incident_id && (
                <div className="border-t p-6" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--card) / 0.5)' }}>
                  {/* Affected Hosts */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
                      <Users className="h-5 w-5" style={{ color: 'hsl(var(--primary-gold))' }} />
                      Affected Hosts
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {incident.affected_hosts.map((host, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg text-sm"
                          style={{
                            backgroundColor: 'hsl(var(--card))',
                            borderWidth: '1px',
                            borderColor: 'hsl(var(--border))',
                            color: 'hsl(var(--foreground))'
                          }}
                        >
                          {host}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Event Types */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
                      <Activity className="h-5 w-5" style={{ color: 'hsl(var(--primary-gold))' }} />
                      Event Types
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {incident.event_types.map((type, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg text-sm"
                          style={{
                            backgroundColor: 'hsl(var(--primary-gold) / 0.1)',
                            borderWidth: '1px',
                            borderColor: 'hsl(var(--primary-gold) / 0.3)',
                            color: 'hsl(var(--accent-gold))'
                          }}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Actions */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
                      <Target className="h-5 w-5" style={{ color: 'hsl(var(--primary-gold))' }} />
                      Recommended Actions
                    </h4>
                    <ul className="space-y-2">
                      {incident.recommended_actions.map((action, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-lg p-3"
                          style={{
                            backgroundColor: 'hsl(var(--card))',
                            borderWidth: '1px',
                            borderColor: 'hsl(var(--border))'
                          }}
                        >
                          <div style={{ color: 'hsl(var(--primary-gold))' }} className="mt-0.5">•</div>
                          <div className="text-sm flex-1" style={{ color: 'hsl(var(--foreground))' }}>{action}</div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
                      <Clock className="h-5 w-5" style={{ color: 'hsl(var(--primary-gold))' }} />
                      Alert Timeline ({incident.alerts.length} alerts)
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {incident.alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-start gap-3 rounded-lg p-3 text-sm"
                          style={{
                            backgroundColor: 'hsl(var(--card) / 0.3)',
                            borderWidth: '1px',
                            borderColor: 'hsl(var(--border) / 0.5)'
                          }}
                        >
                          <div className="min-w-[140px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {formatTimestamp(alert.timestamp)}
                          </div>
                          <div className="min-w-[150px]" style={{ color: 'hsl(var(--accent-gold))' }}>{alert.event_type}</div>
                          <div className="min-w-[100px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{alert.hostname}</div>
                          <div className="flex-1 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{alert.details}</div>
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
      </main>
    </div>
  );
};
