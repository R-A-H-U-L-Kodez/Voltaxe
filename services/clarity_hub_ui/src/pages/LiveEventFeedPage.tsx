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
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Page Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 gradient-gold rounded-2xl flex items-center justify-center shadow-xl">
              <Activity size={32} style={{ color: 'hsl(var(--background))' }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient-gold mb-2">
                Live Event Feed
              </h1>
              <p className="text-muted-foreground flex items-center">
                <Activity className="h-4 w-4 mr-2" style={{ color: 'hsl(var(--primary-gold))' }} />
                Real-time security event monitoring and analysis
              </p>
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="card p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Play/Pause Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-smooth"
                style={{
                  backgroundColor: isPaused ? 'hsl(var(--success) / 0.2)' : 'hsl(var(--warning) / 0.2)',
                  color: isPaused ? 'hsl(var(--success))' : 'hsl(var(--warning))'
                }}
                title={isPaused ? 'Resume live updates' : 'Pause live updates'}
              >
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>

              <button
                onClick={manualRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'hsl(var(--primary-gold) / 0.2)',
                  color: 'hsl(var(--primary-gold))'
                }}
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
                className="w-4 h-4 rounded focus:ring-2"
                style={{
                  accentColor: 'hsl(var(--primary-gold))'
                }}
              />
              <label htmlFor="autoRefresh" className="text-foreground text-sm font-medium">
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
            <div 
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: isPaused 
                  ? 'hsl(var(--warning))' 
                  : autoRefresh 
                  ? 'hsl(var(--success))' 
                  : 'hsl(var(--muted-foreground))',
                animation: autoRefresh && !isPaused ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
              }}
            ></div>
            <span className="text-muted-foreground font-medium">
              {isPaused ? 'Updates paused' : autoRefresh ? `Live updates every ${refreshInterval}s` : 'Manual refresh only'}
            </span>
            <span className="text-muted-foreground ml-4" style={{ color: 'hsl(var(--primary-gold))' }}>
              Showing {filteredEvents.length} of {events.length} events
            </span>
          </div>
        </div>

        {/* Event Feed */}
        <div className="card">
          <div className="p-6 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
            <h2 className="text-2xl font-bold text-foreground">Event Stream</h2>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {loading && events.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative inline-block">
                    <div className="animate-spin rounded-full h-16 w-16 border-4" style={{ borderColor: 'hsl(var(--border))' }}></div>
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 absolute top-0 left-0" style={{ borderColor: 'hsl(var(--primary-gold))' }}></div>
                  </div>
                  <span className="text-muted-foreground font-medium">Loading events...</span>
                </div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                    <Activity size={40} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No events found</h3>
                  <p className="text-muted-foreground">
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
            <div className="p-4 border-t text-center" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--card) / 0.5)' }}>
              <p className="text-muted-foreground text-sm font-medium">
                {events.length > 100 && 'Showing latest 100 events • '}
                Last updated: <span style={{ color: 'hsl(var(--primary-gold))' }}>{new Date().toLocaleTimeString()}</span>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};