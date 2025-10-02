import { useState } from 'react';
import { Alert, AlertSeverity } from '../types';
import { MoreVertical, Check } from 'lucide-react';
import { alertService } from '../services/api';
import { MitreAttackTag, getMitreMapping } from './MitreAttackTag';

interface AlertsTableProps {
  alerts: Alert[];
  onAlertUpdate: () => void;
  onCVEClick?: (cveId: string) => void;
}

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
                Timestamp
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
                    {new Date(alert.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-foreground text-sm font-medium">
                    {alert.hostname}
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
                      <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-surface z-10">
                        {alert.status === 'new' && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            disabled={loading === alert.id}
                            className="w-full text-left px-4 py-3 hover:bg-white/5 text-foreground text-sm flex items-center gap-2 disabled:opacity-50"
                          >
                            <Check size={16} />
                            {loading === alert.id ? 'Acknowledging...' : 'Acknowledge'}
                          </button>
                        )}
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
