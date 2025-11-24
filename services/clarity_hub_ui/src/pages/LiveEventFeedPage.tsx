import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../components/Sidebar';
import { EventListItem } from '../components/EventListItem';
import { EventDetailModal } from '../components/EventDetailModal';
import { eventService } from '../services/api';
import { Event } from '../types';
import { Activity, Play, Pause, RefreshCw, Filter, Loader2 } from 'lucide-react';

export const LiveEventFeedPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const [eps, setEps] = useState(0);
  const [eventHistory, setEventHistory] = useState<{ timestamp: number; count: number }[]>([]);

  const fetchEvents = async (pageNum: number = 1, append: boolean = false) => {
    if (isPaused) return;
    
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const limit = 100;
      const data = await eventService.getEvents(limit, pageNum);
      
      if (append) {
        if (data.length === 0) {
          setHasMore(false);
        } else {
          setEvents(prev => [...prev, ...data]);
        }
      } else {
        setEvents(data);
        setPage(1);
        setHasMore(true);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const manualRefresh = () => {
    fetchEvents();
  };

  useEffect(() => {
    fetchEvents();
  }, []); // Only fetch on mount

  useEffect(() => {
    if (!autoRefresh || isPaused) return;

    const interval = setInterval(() => {
      fetchEvents();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isPaused]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchEvents(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, page]);

  useEffect(() => {
    const now = Date.now();
    const currentCount = events.length;
    
    setEventHistory(prev => {
      const newHistory = [...prev, { timestamp: now, count: currentCount }];
      return newHistory.filter(h => now - h.timestamp < 10000);
    });

    if (eventHistory.length > 1) {
      const oldestEntry = eventHistory[0];
      const timeDiff = (now - oldestEntry.timestamp) / 1000;
      const eventDiff = currentCount - oldestEntry.count;
      const calculatedEps = timeDiff > 0 ? eventDiff / timeDiff : 0;
      setEps(Math.max(0, calculatedEps));
    }
  }, [events.length, eventHistory]);

  const filteredEvents = events.filter(event => {
    if (filterType !== 'all' && event.type !== filterType) return false;
    if (filterSeverity !== 'all' && event.severity !== filterSeverity) return false;
    return true;
  });

  const eventTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'VULNERABILITY_DETECTED', label: 'Vulnerabilities' },
    { value: 'SUSPICIOUS_PARENT_CHILD', label: 'Suspicious Activity' },
    { value: 'NEW_PROCESS_DETECTED', label: 'New Processes' },
  ];

  const severityLevels = [
    { value: 'all', label: 'All Severities' },
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
    { value: 'INFO', label: 'Info' },
  ];

  const intervalOptions = [
    { value: 2, label: '2s' },
    { value: 5, label: '5s' },
    { value: 10, label: '10s' },
    { value: 30, label: '30s' },
    { value: 60, label: '1m' },
  ];

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />
      
      <main className="flex-1 overflow-auto ml-64">
        <div className="border-b p-8" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.2)' }}>
              <Activity size={32} style={{ color: 'hsl(var(--primary-gold))' }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Live Event Feed</h1>
              <p className="text-muted-foreground text-lg">The Unfiltered Stream</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
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

              <div 
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono"
                style={{ 
                  backgroundColor: 'hsl(var(--primary-gold) / 0.1)',
                  borderLeft: '3px solid hsl(var(--primary-gold))'
                }}
              >
                <span className="text-foreground text-sm font-medium">EPS:</span>
                <span className="text-xl font-bold" style={{ color: 'hsl(var(--primary-gold))' }}>
                  {eps.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm">
              <div 
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: isPaused 
                    ? 'hsl(var(--warning))' 
                    : autoRefresh 
                    ? 'hsl(var(--success))' 
                    : 'hsl(var(--muted-foreground))'
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
                <>
                  <div className="divide-y divide-border">
                    {filteredEvents.map((event) => (
                      <EventListItem 
                        key={event.id}
                        event={event} 
                        onClick={() => setSelectedEvent(event)}
                      />
                    ))}
                  </div>
                  
                  {hasMore && (
                    <div ref={observerTarget} className="p-4 flex items-center justify-center">
                      {loadingMore && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="animate-spin" size={18} />
                          <span className="text-sm">Loading more events...</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {filteredEvents.length > 0 && (
              <div className="p-4 border-t text-center" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--card) / 0.5)' }}>
                <p className="text-muted-foreground text-sm font-medium">
                  Last updated: <span style={{ color: 'hsl(var(--primary-gold))' }}>{new Date().toLocaleTimeString()}</span>
                  {!hasMore && <span className="ml-4">• All events loaded</span>}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedEvent && (
        <EventDetailModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </div>
  );
};
