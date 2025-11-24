import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertSeverity } from '../types';
import { MoreVertical, Check, ExternalLink, Shield, AlertTriangle } from 'lucide-react';
import { alertService, endpointService } from '../services/api';
import { MitreAttackTag, getMitreMapping } from './MitreAttackTag';

interface AlertsTableProps {
  alerts: Alert[];
  onAlertUpdate: () => void;
  onCVEClick?: (cveId: string) => void;
}

// Helper function to calculate relative time
const getRelativeTime = (timestamp: string): string => {
  const now = Date.now();
  const alertTime = new Date(timestamp).getTime();
  const diffMs = now - alertTime;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return new Date(timestamp).toLocaleDateString();
};

const getSeverityColor = (severity: AlertSeverity) => {
  switch (severity) {
    case 'critical':
      return 'bg-danger/10 text-danger border-danger';
    case 'high':
      return 'bg-warning/10 text-warning border-warning';
    case 'medium':
      return 'bg-accent-gold/10 text-accent-gold border-accent-gold';
    case 'low':
      return 'bg-foreground/10 text-foreground border-foreground/30';
  }
};

const getStatusColor = (status: string) => {
  return status === 'new'
    ? 'bg-primary-gold/10 text-primary-gold border-primary-gold'
    : 'bg-success/10 text-success border-success';
};

const renderDetailsWithCVELinks = (details: string, onCVEClick?: (cveId: string) => void) => {
  if (!onCVEClick) return details;
  
  // Regular expression to match CVE IDs
  const cveRegex = /(CVE-\d{4}-\d{4,7})/gi;
  const parts = details.split(cveRegex);
  
  return parts.map((part, index) => {
    if (part.match(cveRegex)) {
      return (
        <button
          key={index}
          onClick={() => onCVEClick(part)}
          className="text-primary-gold hover:text-accent-gold underline font-medium"
        >
          {part}
        </button>
      );
    }
    return part;
  });
};

const renderMitreTag = (alertType: string, details: string) => {
  const mitreMapping = getMitreMapping(alertType || 'unknown', details);
  return (
    <MitreAttackTag
      techniqueId={mitreMapping.techniqueId}
      techniqueName={mitreMapping.techniqueName}
      className="text-xs"
    />
  );
};

export const AlertsTable = ({ alerts, onAlertUpdate, onCVEClick }: AlertsTableProps) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAcknowledge = async (alertId: string) => {
    try {
      setLoading(alertId);
      await alertService.acknowledgeAlert(alertId);
      onAlertUpdate();
      setOpenMenuId(null);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleInvestigate = (hostname: string) => {
    navigate(`/endpoints/${hostname}`);
    setOpenMenuId(null);
  };

  const handleIsolateHost = async (hostname: string, alertId: string) => {
    if (!window.confirm(`Are you sure you want to isolate ${hostname}? This will cut all network access.`)) {
      return;
    }
    
    try {
      setLoading(alertId);
      await endpointService.isolateEndpoint(hostname);
      window.alert(`Host ${hostname} has been isolated successfully.`);
      onAlertUpdate();
      setOpenMenuId(null);
    } catch (error) {
      console.error('Failed to isolate host:', error);
      window.alert(`Failed to isolate host: ${error}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-input border-b border-border">
            <tr>
              <th className="text-left px-6 py-4 text-foreground font-semibold text-sm">
                Severity
              </th>
              <th className="text-left px-6 py-4 text-foreground font-semibold text-sm">
                Time & Age
              </th>
              <th className="text-left px-6 py-4 text-foreground font-semibold text-sm">
                Hostname
              </th>
              <th className="text-left px-6 py-4 text-foreground font-semibold text-sm">
                Details
              </th>
              <th className="text-left px-6 py-4 text-foreground font-semibold text-sm">
                MITRE ATT&CK
              </th>
              <th className="text-left px-6 py-4 text-foreground font-semibold text-sm">
                Status
              </th>
              <th className="text-left px-6 py-4 text-foreground font-semibold text-sm">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-foreground/50">
                  No alerts found
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr
                  key={alert.id}
                  className="border-b border-border hover:bg-white/5"
                >
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                        alert.severity
                      )}`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-foreground text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {getRelativeTime(alert.timestamp)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-foreground text-sm">
                    <button
                      onClick={() => handleInvestigate(alert.hostname)}
                      className="font-medium hover:text-primary-gold transition-smooth flex items-center gap-1.5 group"
                    >
                      {alert.hostname}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-smooth" />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-foreground/70 text-sm max-w-md">
                    {renderDetailsWithCVELinks(alert.details, onCVEClick)}
                  </td>
                  <td className="px-6 py-4">
                    {renderMitreTag(alert.eventType, alert.details)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        alert.status
                      )}`}
                    >
                      {alert.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 relative">
                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === alert.id ? null : alert.id)
                      }
                      className="p-2 hover:bg-white/5 rounded-lg text-foreground"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openMenuId === alert.id && (
                      <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-surface z-10">
                        {alert.status === 'new' && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            disabled={loading === alert.id}
                            className="w-full text-left px-4 py-3 hover:bg-white/5 text-foreground text-sm flex items-center gap-2 disabled:opacity-50 border-b border-border"
                          >
                            <Check size={16} />
                            {loading === alert.id ? 'Acknowledging...' : 'Acknowledge Alert'}
                          </button>
                        )}
                        <button
                          onClick={() => handleInvestigate(alert.hostname)}
                          className="w-full text-left px-4 py-3 hover:bg-white/5 text-foreground text-sm flex items-center gap-2 border-b border-border"
                        >
                          <ExternalLink size={16} />
                          Investigate Endpoint
                        </button>
                        <button
                          onClick={() => {
                            window.alert('Create Incident feature coming soon!');
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-white/5 text-foreground text-sm flex items-center gap-2 border-b border-border"
                        >
                          <AlertTriangle size={16} />
                          Create Incident
                        </button>
                        <button
                          onClick={() => handleIsolateHost(alert.hostname, alert.id)}
                          disabled={loading === alert.id}
                          className="w-full text-left px-4 py-3 hover:bg-danger/10 text-danger text-sm flex items-center gap-2 disabled:opacity-50 rounded-b-lg"
                        >
                          <Shield size={16} />
                          {loading === alert.id ? 'Isolating...' : 'Isolate Host'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
