import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Shield, Clock, Activity, ChevronDown, ChevronUp, TrendingUp, 
  Target, Download, FileText, User, MessageSquare, ExternalLink, 
  GitBranch, BookOpen, CheckCircle, PlayCircle
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { incidentService } from '../services/api';
import { Incident, IncidentStats } from '../types';
import { 
  getMitreAttackIds, 
  getMitreUrl, 
  getPlaybooksForIncident,
  findRelatedIncidents,
  exportIncidentToCSV,
  exportIncidentToPDF,
  formatDuration
} from '../utils/incidentHelpers';

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [timeWindow, setTimeWindow] = useState<number>(24);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchIncidents();
    fetchStats();
    fetchAllIncidents();
    fetchTeamMembers();
    const interval = setInterval(() => {
      fetchIncidents();
      fetchStats();
    }, 60000);
    return () => clearInterval(interval);
  }, [filterSeverity, filterStatus, timeWindow]);

  const fetchIncidents = async () => {
    try {
      const data = await incidentService.getIncidents({
        severity: filterSeverity || undefined,
        status: filterStatus || undefined,
        hours: timeWindow,
      });
      const enrichedIncidents = (data.incidents || []).map(inc => ({
        ...inc,
        mitre_attack_ids: getMitreAttackIds(inc.kill_chain_stage),
        suggested_playbooks: getPlaybooksForIncident(inc),
        comments: inc.comments || [],
        related_incidents: []
      }));
      setIncidents(enrichedIncidents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setLoading(false);
    }
  };

  const fetchAllIncidents = async () => {
    try {
      const data = await incidentService.getIncidents({ hours: 168 }); // Last 7 days
      setAllIncidents(data.incidents || []);
    } catch (error) {
      console.error('Error fetching all incidents:', error);
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

  const fetchTeamMembers = async () => {
    try {
      const members = await incidentService.getTeamMembers();
      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
      // Fallback to mock data for demo
      setTeamMembers([
        { id: '1', name: 'Alice Johnson', email: 'alice@voltaxe.com' },
        { id: '2', name: 'Bob Smith', email: 'bob@voltaxe.com' },
        { id: '3', name: 'Carol White', email: 'carol@voltaxe.com' }
      ]);
    }
  };

  const handleStatusChange = async (incidentId: string, newStatus: string) => {
    try {
      await incidentService.updateIncidentStatus(incidentId, newStatus);
      fetchIncidents();
    } catch (error) {
      console.error('Error updating status:', error);
      window.alert('Failed to update status. API may not be implemented yet.');
    }
  };

  const handleAssignment = async (incidentId: string, assignee: string) => {
    try {
      await incidentService.assignIncident(incidentId, assignee);
      fetchIncidents();
    } catch (error) {
      console.error('Error assigning incident:', error);
      window.alert('Failed to assign incident. API may not be implemented yet.');
    }
  };

  const handleAddComment = async (incidentId: string) => {
    const content = commentText[incidentId];
    if (!content?.trim()) return;
    
    try {
      await incidentService.addComment(incidentId, content);
      setCommentText({ ...commentText, [incidentId]: '' });
      fetchIncidents();
    } catch (error) {
      console.error('Error adding comment:', error);
      window.alert('Failed to add comment. API may not be implemented yet.');
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return { backgroundColor: 'hsl(var(--danger))', color: 'hsl(var(--background))' };
      case 'high':
        return { backgroundColor: 'hsl(var(--accent-gold))', color: 'hsl(var(--background))' };
      case 'medium':
        return { backgroundColor: 'hsl(var(--warning))', color: 'hsl(var(--background))' };
      case 'low':
        return { backgroundColor: 'hsl(var(--success))', color: 'hsl(var(--background))' };
      default:
        return { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' };
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return { backgroundColor: 'hsl(var(--danger))', color: 'hsl(var(--background))' };
      case 'investigating':
        return { backgroundColor: 'hsl(var(--warning))', color: 'hsl(var(--background))' };
      case 'resolved':
        return { backgroundColor: 'hsl(var(--success))', color: 'hsl(var(--background))' };
      default:
        return { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' };
    }
  };

  const toggleIncident = (incidentId: string) => {
    setExpandedIncident(expandedIncident === incidentId ? null : incidentId);
    if (expandedIncident !== incidentId) {
      setActiveTab({ ...activeTab, [incidentId]: 'timeline' });
    }
  };

  const getRelatedIncidents = (incident: Incident) => {
    return findRelatedIncidents(incident, allIncidents);
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="flex items-center justify-center py-12">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-16 w-16 border-4" style={{ borderColor: 'hsl(var(--border))' }}></div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 absolute top-0 left-0" style={{ borderColor: 'hsl(var(--primary-gold))' }}></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />
      <main className="ml-64 p-8">
        {/* Page Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl" style={{ 
                background: 'linear-gradient(135deg, hsl(var(--danger)) 0%, hsl(var(--accent-gold)) 100%)'
              }}>
                <Shield size={32} style={{ color: 'hsl(var(--background))' }} />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gradient-gold mb-2">
                  Security Incidents
                </h1>
                <p className="text-muted-foreground flex items-center">
                  <Target className="h-4 w-4 mr-2" style={{ color: 'hsl(var(--accent-gold))' }} />
                  Correlated attack scenarios and multi-stage threats
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fadeIn">
            <div className="card p-5 hover-lift">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Alert Reduction
                </p>
                <TrendingUp className="h-5 w-5" style={{ color: 'hsl(var(--primary-gold))' }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: 'hsl(var(--primary-gold))' }}>
                {stats.alert_reduction_percent}%
              </p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {stats.total_alerts} alerts → {stats.total_incidents} incidents
              </p>
            </div>

            <div className="card p-5 hover-lift">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Total Incidents
                </p>
                <Shield className="h-5 w-5" style={{ color: 'hsl(var(--accent-gold))' }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                {stats.total_incidents}
              </p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Past {stats.time_window_hours}h
              </p>
            </div>

            <div className="card p-5 hover-lift">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Critical
                </p>
                <AlertTriangle className="h-5 w-5" style={{ color: 'hsl(var(--danger))' }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: 'hsl(var(--danger))' }}>
                {stats.severity_distribution.critical}
              </p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Require immediate attention
              </p>
            </div>

            <div className="card p-5 hover-lift">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Multi-Host Attacks
                </p>
                <Target className="h-5 w-5" style={{ color: 'hsl(var(--accent-gold))' }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: 'hsl(var(--accent-gold))' }}>
                {stats.multi_host_incidents}
              </p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Lateral movement detected
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                Severity
              </label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:border-primary-gold cursor-pointer"
                style={{ 
                  backgroundColor: 'hsl(var(--input))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))'
                }}
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:border-primary-gold cursor-pointer"
                style={{ 
                  backgroundColor: 'hsl(var(--input))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))'
                }}
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                Time Window
              </label>
              <select
                value={timeWindow}
                onChange={(e) => setTimeWindow(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:border-primary-gold cursor-pointer"
                style={{ 
                  backgroundColor: 'hsl(var(--input))',
                  border: '1px solid hsl(var(--border))',
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
            </div>
          </div>

        {/* Incidents List */}
        {incidents.length === 0 ? (
          <div className="card p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>No Incidents Detected</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => {
              const isExpanded = expandedIncident === incident.incident_id;
              const currentTab = activeTab[incident.incident_id] || 'timeline';
              const relatedIncidents = getRelatedIncidents(incident);

              return (
                <div
                  key={incident.incident_id}
                  className="card overflow-hidden"
                >
                  {/* Incident Header */}
                  <div
                    className="p-6 cursor-pointer hover-lift transition-smooth"
                      onClick={() => toggleIncident(incident.incident_id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                            {incident.title}
                          </h3>
                          <span
                            className="px-3 py-1 rounded text-xs font-medium"
                            style={getSeverityBadgeColor(incident.severity)}
                          >
                            {incident.severity.toUpperCase()}
                          </span>
                          <span
                            className="px-3 py-1 rounded text-xs font-medium"
                            style={getStatusBadgeColor(incident.status)}
                          >
                            {incident.status.toUpperCase()}
                          </span>
                          {incident.assigned_to && (
                            <span className="px-3 py-1 rounded text-xs flex items-center gap-1" style={{
                              backgroundColor: 'hsl(var(--primary-gold) / 0.2)',
                              color: 'hsl(var(--primary-gold))'
                            }}>
                              <User className="w-3 h-3" />
                                {incident.assigned_to}
                              </span>
                            )}
                          </div>
                          <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {incident.description}
                          </p>

                          {/* Quick Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="rounded p-3" style={{ backgroundColor: 'hsl(var(--muted) / 0.2)' }}>
                              <div className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Alert Count</div>
                              <div className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                                {incident.alert_count}
                              </div>
                            </div>
                            <div className="bg-gray-800/50 rounded p-3">
                              <div className="text-xs text-gray-500 mb-1">Affected Hosts</div>
                              <div className="text-lg font-semibold text-white">
                                {incident.affected_hosts.length}
                              </div>
                            </div>
                            <div className="bg-gray-800/50 rounded p-3">
                              <div className="text-xs text-gray-500 mb-1">Kill Chain Stage</div>
                              <div className="text-sm font-semibold text-orange-400">
                                {incident.kill_chain_stage}
                              </div>
                            </div>
                            <div className="bg-gray-800/50 rounded p-3">
                              <div className="text-xs text-gray-500 mb-1">Duration</div>
                              <div className="text-lg font-semibold text-white">
                                {formatDuration(incident.first_seen, incident.last_seen)}
                              </div>
                            </div>
                            <div className="bg-gray-800/50 rounded p-3">
                              <div className="text-xs text-gray-500 mb-1">First Seen</div>
                              <div className="text-xs font-medium text-gray-300">
                                {new Date(incident.first_seen).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {isExpanded ? (
                            <ChevronUp className="w-6 h-6 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-800">
                        {/* Action Bar */}
                        <div className="bg-gray-800/30 px-6 py-3 flex items-center justify-between border-b border-gray-800">
                          <div className="flex gap-2">
                            <select
                              value={incident.status}
                              onChange={(e) => handleStatusChange(incident.incident_id, e.target.value)}
                              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="open">Open</option>
                              <option value="investigating">Investigating</option>
                              <option value="resolved">Resolved</option>
                            </select>

                            <select
                              value={incident.assigned_to || ''}
                              onChange={(e) => handleAssignment(incident.incident_id, e.target.value)}
                              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="">Assign to...</option>
                              {teamMembers.map(member => (
                                <option key={member.id} value={member.name}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                exportIncidentToCSV(incident);
                              }}
                              className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                            >
                              <Download className="w-4 h-4" />
                              CSV
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                exportIncidentToPDF(incident);
                              }}
                              className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                            >
                              <FileText className="w-4 h-4" />
                              PDF
                            </button>
                          </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-gray-800/20 px-6 py-2 flex gap-4 border-b border-gray-800">
                          {['timeline', 'mitre', 'playbooks', 'related', 'comments'].map(tab => (
                            <button
                              key={tab}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab({ ...activeTab, [incident.incident_id]: tab });
                              }}
                              className={`px-4 py-2 text-sm font-medium transition-colors ${
                                currentTab === tab
                                  ? 'text-blue-400 border-b-2 border-blue-400'
                                  : 'text-gray-400 hover:text-gray-300'
                              }`}
                            >
                              {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                          ))}
                        </div>

                        <div className="p-6">
                          {/* Timeline Tab */}
                          {currentTab === 'timeline' && (
                            <div>
                              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-400" />
                                Visual Timeline
                              </h4>
                              
                              {/* Visual Timeline Graph */}
                              <div className="relative mb-6">
                                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-red-500"></div>
                                {incident.alerts
                                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                                  .map((alert) => (
                                  <div key={alert.id} className="relative pl-12 pb-8 last:pb-0">
                                    <div className="absolute left-2.5 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-gray-900"></div>
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs text-gray-500">
                                              {new Date(alert.timestamp).toLocaleTimeString()}
                                            </span>
                                            <span className="px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded text-xs">
                                              {alert.event_type}
                                            </span>
                                            <span className="px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded text-xs">
                                              {alert.hostname}
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-300">{alert.details}</p>
                                        </div>
                                        <Activity className="w-4 h-4 text-gray-500 ml-2" />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Affected Hosts */}
                              <div className="mb-6">
                                <h5 className="text-sm font-semibold text-gray-300 mb-2">
                                  Affected Hosts ({incident.affected_hosts.length})
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {incident.affected_hosts.map((host) => (
                                    <span
                                      key={host}
                                      className="px-3 py-1 bg-red-900/20 text-red-400 rounded text-sm"
                                    >
                                      {host}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Event Types */}
                              <div className="mb-6">
                                <h5 className="text-sm font-semibold text-gray-300 mb-2">
                                  Event Types ({incident.event_types.length})
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {incident.event_types.map((type) => (
                                    <span
                                      key={type}
                                      className="px-3 py-1 bg-purple-900/20 text-purple-400 rounded text-sm"
                                    >
                                      {type}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Recommended Actions */}
                              <div>
                                <h5 className="text-sm font-semibold text-gray-300 mb-2">
                                  Recommended Actions
                                </h5>
                                <ul className="space-y-2">
                                  {incident.recommended_actions.map((action, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                      {action}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* MITRE ATT&CK Tab */}
                          {currentTab === 'mitre' && (
                            <div>
                              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-orange-400" />
                                MITRE ATT&CK Mapping
                              </h4>
                              
                              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
                                <div className="text-sm text-gray-400 mb-2">Kill Chain Stage</div>
                                <div className="text-xl font-semibold text-orange-400 mb-4">
                                  {incident.kill_chain_stage}
                                </div>
                                
                                <div className="text-sm text-gray-400 mb-2">Associated MITRE ATT&CK IDs</div>
                                <div className="flex flex-wrap gap-2">
                                  {incident.mitre_attack_ids?.map(id => (
                                    <a
                                      key={id}
                                      href={getMitreUrl(id)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1 bg-orange-900/20 text-orange-400 rounded text-sm hover:bg-orange-900/30 flex items-center gap-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {id}
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ))}
                                </div>
                              </div>

                              <div className="text-xs text-gray-500">
                                Click on any ID to view full technique details on the MITRE ATT&CK website
                              </div>
                            </div>
                          )}

                          {/* Playbooks Tab */}
                          {currentTab === 'playbooks' && (
                            <div>
                              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-green-400" />
                                Response Playbooks
                              </h4>
                              
                              {incident.suggested_playbooks && incident.suggested_playbooks.length > 0 ? (
                                <div className="space-y-4">
                                  {incident.suggested_playbooks.map(playbook => (
                                    <div key={playbook.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                      <div className="flex items-start justify-between mb-3">
                                        <div>
                                          <h5 className="text-lg font-semibold text-white mb-1">
                                            {playbook.name}
                                          </h5>
                                          <p className="text-sm text-gray-400">{playbook.description}</p>
                                        </div>
                                        <PlayCircle className="w-6 h-6 text-green-400" />
                                      </div>
                                      
                                      <div className="space-y-2">
                                        {playbook.steps.map((step, idx) => (
                                          <div key={idx} className="flex items-start gap-3 text-sm">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-900/30 text-green-400 flex items-center justify-center text-xs font-bold">
                                              {idx + 1}
                                            </span>
                                            <span className="text-gray-300 pt-0.5">{step}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  No specific playbooks available for this incident type
                                </div>
                              )}
                            </div>
                          )}

                          {/* Related Incidents Tab */}
                          {currentTab === 'related' && (
                            <div>
                              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <GitBranch className="w-5 h-5 text-purple-400" />
                                Related Incidents
                              </h4>
                              
                              {relatedIncidents.length > 0 ? (
                                <div className="space-y-3">
                                  {relatedIncidents.map(related => (
                                    <div key={related.incident_id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <h5 className="text-sm font-semibold text-white mb-1">
                                            {related.title}
                                          </h5>
                                          <div className="text-xs text-gray-500">
                                            {new Date(related.occurred_at).toLocaleString()}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-semibold text-purple-400">
                                            {related.similarity_score}%
                                          </span>
                                          <span className="text-xs text-gray-500">similar</span>
                                        </div>
                                      </div>
                                      {related.common_event_types.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {related.common_event_types.map((event: string) => (
                                            <span key={event} className="px-2 py-0.5 bg-purple-900/20 text-purple-400 rounded text-xs">
                                              {event}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  No related incidents found
                                </div>
                              )}
                            </div>
                          )}

                          {/* Comments Tab */}
                          {currentTab === 'comments' && (
                            <div>
                              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-400" />
                                Analyst Notes & Collaboration
                              </h4>
                              
                              {/* Add Comment */}
                              <div className="mb-6">
                                <textarea
                                  value={commentText[incident.incident_id] || ''}
                                  onChange={(e) => setCommentText({ ...commentText, [incident.incident_id]: e.target.value })}
                                  placeholder="Add your analysis notes, findings, or questions..."
                                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm mb-2 min-h-[100px]"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddComment(incident.incident_id);
                                  }}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                                >
                                  Add Comment
                                </button>
                              </div>

                              {/* Comments List */}
                              {incident.comments && incident.comments.length > 0 ? (
                                <div className="space-y-3">
                                  {incident.comments.map(comment => (
                                    <div key={comment.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                                            {comment.author.charAt(0).toUpperCase()}
                                          </div>
                                          <div>
                                            <div className="text-sm font-semibold text-white">
                                              {comment.author}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {new Date(comment.timestamp).toLocaleString()}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-300 ml-10">{comment.content}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  No comments yet. Be the first to add analysis notes!
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  };
