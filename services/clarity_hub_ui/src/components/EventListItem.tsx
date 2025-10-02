import { Event, EventType } from '../types';
import { Shield, AlertTriangle, Settings } from 'lucide-react';
import { formatDistanceToNow } from '../utils/dateUtils';

interface EventListItemProps {
  event: Event;
}

const getEventIcon = (type: EventType) => {
  switch (type) {
    case 'VULNERABILITY_DETECTED':
      return <Shield className="text-primary-gold" size={18} />;
    case 'SUSPICIOUS_PARENT_CHILD':
      return <AlertTriangle className="text-danger" size={18} />;
    case 'NEW_PROCESS_DETECTED':
      return <Settings className="text-foreground/50" size={18} />;
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
    <div className="flex gap-3 p-3 border-b border-border last:border-0 hover:bg-white/5">
      <div className="flex-shrink-0 mt-1">
        {getEventIcon(event.type)}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-foreground font-semibold text-sm mb-1">
          {getEventTitle(event.type)}
        </h4>
        <p className="text-foreground/70 text-xs mb-1 line-clamp-2">
          {event.details}
        </p>
        <p className="text-foreground/50 text-xs">
          {formatDistanceToNow(event.timestamp)}
        </p>
      </div>
    </div>
  );
};
