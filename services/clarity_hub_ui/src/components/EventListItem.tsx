import { Event, EventType } from '../types';
import { Shield, AlertTriangle, Activity } from 'lucide-react';
import { formatDistanceToNow } from '../utils/dateUtils';
import { HighlightedText } from '../utils/highlightKeywords';
import { useNavigate } from 'react-router-dom';

interface EventListItemProps {
  event: Event;
  onClick?: () => void;
}

const getEventIcon = (type: EventType, severity: string) => {
  switch (type) {
    case 'VULNERABILITY_DETECTED':
      return <Shield size={18} style={{ color: 'hsl(var(--primary-gold))' }} />;
    case 'SUSPICIOUS_PARENT_CHILD':
      // Red for critical/high, orange for medium
      const color = severity === 'CRITICAL' || severity === 'HIGH' 
        ? 'hsl(var(--danger))' 
        : 'hsl(45, 100%, 55%)'; // Orange
      return <AlertTriangle size={18} style={{ color }} />;
    case 'NEW_PROCESS_DETECTED':
      return <Activity size={18} className="text-muted-foreground" />;
    default:
      return <Activity size={18} className="text-muted-foreground" />;
  }
};

const getEventTitle = (type: EventType) => {
  switch (type) {
    case 'VULNERABILITY_DETECTED':
      return 'Vulnerability Detected';
    case 'SUSPICIOUS_PARENT_CHILD':
      return 'Suspicious Behavior';
    case 'NEW_PROCESS_DETECTED':
      return 'New Process';
    default:
      return 'System Event';
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity.toUpperCase()) {
    case 'CRITICAL':
      return 'hsl(var(--danger))';
    case 'HIGH':
      return 'hsl(0, 70%, 55%)';
    case 'MEDIUM':
      return 'hsl(45, 100%, 55%)'; // Orange
    case 'LOW':
      return 'hsl(48, 100%, 50%)'; // Yellow
    case 'INFO':
    default:
      return 'hsl(var(--muted-foreground))';
  }
};

export const EventListItem = ({ event, onClick }: EventListItemProps) => {
  const navigate = useNavigate();

  const handleHostnameClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the event detail modal
    navigate(`/fleet/endpoint/${event.hostname}`);
  };

  return (
    <div 
      className="flex gap-3 p-4 border-b transition-smooth hover:bg-white/5 cursor-pointer" 
      style={{ borderColor: 'hsl(var(--border))' }}
      onClick={onClick}
    >
      <div className="flex-shrink-0 mt-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}>
          {getEventIcon(event.type, event.severity || 'INFO')}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-foreground font-semibold">
            {getEventTitle(event.type)}
          </h4>
          <span 
            className="px-2 py-0.5 rounded text-xs font-bold uppercase"
            style={{ 
              backgroundColor: `${getSeverityColor(event.severity || 'INFO')}20`,
              color: getSeverityColor(event.severity || 'INFO')
            }}
          >
            {event.severity || 'INFO'}
          </span>
        </div>
        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
          <HighlightedText text={event.details} />
        </p>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleHostnameClick}
            className="text-muted-foreground font-medium hover:underline transition-smooth"
            style={{ color: 'hsl(var(--primary-gold))' }}
            title="View endpoint details"
          >
            {event.hostname}
          </button>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{formatDistanceToNow(event.timestamp)}</span>
        </div>
      </div>
    </div>
  );
};
