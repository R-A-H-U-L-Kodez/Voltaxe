import { Event, EventType } from '../types';
import { Shield, AlertTriangle, Settings } from 'lucide-react';
import { formatDistanceToNow } from '../utils/dateUtils';

interface EventListItemProps {
  event: Event;
}

const getEventIcon = (type: EventType) => {
  switch (type) {
    case 'VULNERABILITY_DETECTED':
      return <Shield size={18} style={{ color: 'hsl(var(--primary-gold))' }} />;
    case 'SUSPICIOUS_PARENT_CHILD':
      return <AlertTriangle size={18} style={{ color: 'hsl(var(--danger))' }} />;
    case 'NEW_PROCESS_DETECTED':
      return <Settings size={18} className="text-muted-foreground" />;
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
  }
};

export const EventListItem = ({ event }: EventListItemProps) => {
  return (
    <div className="flex gap-3 p-4 border-b transition-smooth hover:bg-white/5" style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="flex-shrink-0 mt-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}>
          {getEventIcon(event.type)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-foreground font-semibold mb-1">
          {getEventTitle(event.type)}
        </h4>
        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
          {event.details}
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground font-medium">{event.hostname}</span>
          <span className="text-muted-foreground">•</span>
          <span style={{ color: 'hsl(var(--primary-gold))' }}>{formatDistanceToNow(event.timestamp)}</span>
        </div>
      </div>
    </div>
  );
};
