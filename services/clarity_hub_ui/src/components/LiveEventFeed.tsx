import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pause, Play, ArrowRight } from 'lucide-react';
import { eventService } from '../services/api';
import { Event } from '../types';
import { EventListItem } from './EventListItem';

export const LiveEventFeed = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getEvents();
        setEvents(data.slice(0, 10));
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    if (!isPaused) {
      const interval = setInterval(fetchEvents, 5000);
      return () => clearInterval(interval);
    }
  }, [isPaused]);

  return (
    <div className="bg-card border border-border rounded-lg shadow-surface h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Live Event Feed</h2>
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="p-2 hover:bg-white/5 rounded-lg text-foreground"
          title={isPaused ? 'Resume updates' : 'Pause updates'}
        >
          {isPaused ? <Play size={18} /> : <Pause size={18} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-foreground/50">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-foreground/50">No recent events</p>
          </div>
        ) : (
          events.map((event) => <EventListItem key={event.id} event={event} />)
        )}
      </div>

      <div className="p-4 border-t border-border">
        <Link
          to="/alerts"
          className="flex items-center justify-center gap-2 text-primary-gold hover:text-accent-gold text-sm font-medium"
        >
          View All Alerts
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};
