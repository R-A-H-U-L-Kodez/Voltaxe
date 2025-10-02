import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { EventListItem } from '../components/EventListItem';
import { eventService } from '../services/api';
import { Event } from '../types';
import { Activity, Pause, Play, RefreshCw, Filter, Loader2 } from 'lucide-react';

export const LiveEventFeedPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [refreshInterval, setRefreshInterval] = useState(5); // seconds

  const fetchEvents = async () => {
    try {
      if (!isPaused) {
        const data = await eventService.getEvents();
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const manualRefresh = async () => {
    setLoading(true);
    await fetchEvents();
  };

  useEffect(() => {
    fetchEvents();

    if (autoRefresh && !isPaused) {
      const interval = setInterval(fetchEvents, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [isPaused, autoRefresh, refreshInterval]);

  const filteredEvents = events.filter(event => {
    const typeMatch = filterType === 'all' || event.type === filterType;
    const severityMatch = filterSeverity === 'all' || event.severity === filterSeverity;
    return typeMatch && severityMatch;
  });

  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'VULNERABILITY_DETECTED', label: 'Vulnerabilities' },
    { value: 'SUSPICIOUS_PARENT_CHILD_PROCESS', label: 'Suspicious Process' },
    { value: 'NEW_PROCESS_DETECTED', label: 'New Process' },
  ];

  const severityLevels = [
    { value: 'all', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const intervalOptions = [
    { value: 1, label: '1s' },
    { value: 2, label: '2s' },
    { value: 5, label: '5s' },
    { value: 10, label: '10s' },
    { value: 30, label: '30s' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-primary-gold" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Live Event Feed</h1>
              <p className="text-foreground/70">Real-time security event monitoring and analysis</p>
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Play/Pause Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                  isPaused
                    ? 'bg-success/20 text-success hover:bg-success/30'
                    : 'bg-warning/20 text-warning hover:bg-warning/30'
                }`}
                title={isPaused ? 'Resume live updates' : 'Pause live updates'}
              >
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>

              <button
                onClick={manualRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-primary-gold/20 text-primary-gold hover:bg-primary-gold/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                Refresh
              </button>
            </div>

            {/* Auto-refresh Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-primary-gold bg-input border-border rounded focus:ring-primary-gold"
              />
              <label htmlFor="autoRefresh" className="text-foreground text-sm">
                Auto-refresh
              </label>
            </div>

            {/* Refresh Interval */}
            {autoRefresh && (
              <div className="flex items-center gap-2">
                <span className="text-foreground text-sm">Every:</span>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="px-3 py-1 bg-input border border-border rounded text-foreground text-sm focus:outline-none focus:border-primary-gold"
                >
                  {intervalOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-2 ml-auto">
              <Filter className="text-foreground/40" size={18} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-input border border-border rounded text-foreground text-sm focus:outline-none focus:border-primary-gold"
              >
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 bg-input border border-border rounded text-foreground text-sm focus:outline-none focus:border-primary-gold"
              >
                {severityLevels.map(severity => (
                  <option key={severity.value} value={severity.value}>
                    {severity.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="mt-4 flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-warning' : autoRefresh ? 'bg-success animate-pulse' : 'bg-foreground/40'}`}></div>
            <span className="text-foreground/70">
              {isPaused ? 'Updates paused' : autoRefresh ? `Live updates every ${refreshInterval}s` : 'Manual refresh only'}
            </span>
            <span className="text-foreground/50 ml-4">
              Showing {filteredEvents.length} of {events.length} events
            </span>
          </div>
        </div>

        {/* Event Feed */}
        <div className="bg-card border border-border rounded-lg shadow-surface">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Event Stream</h2>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {loading && events.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3">
                  <Loader2 className="text-primary-gold animate-spin" size={24} />
                  <span className="text-foreground/70">Loading events...</span>
                </div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Activity className="text-foreground/30 mx-auto mb-4" size={48} />
                  <h3 className="text-foreground text-lg mb-2">No events found</h3>
                  <p className="text-foreground/60">
                    {events.length === 0 
                      ? 'No events have been captured yet. Start your monitoring agents to see data.' 
                      : 'No events match your current filters. Try adjusting the filter settings.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredEvents.map((event, index) => (
                  <div 
                    key={event.id} 
                    className={`${index < 3 ? 'animate-pulse-once' : ''}`}
                  >
                    <EventListItem event={event} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {filteredEvents.length > 0 && (
            <div className="p-4 border-t border-border bg-card/50 text-center">
              <p className="text-foreground/60 text-sm">
                {events.length > 100 && 'Showing latest 100 events • '}
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};