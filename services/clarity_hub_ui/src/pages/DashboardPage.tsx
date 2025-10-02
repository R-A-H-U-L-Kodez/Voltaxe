import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ReportGenerator } from '../components/ReportGenerator';
import { snapshotService, eventService } from '../services/api';
import { generateSecurityReport } from '../utils/reportGenerator';
import { Snapshot, Event } from '../types';
import { Server, AlertCircle, Activity, ArrowRight, TrendingUp, Camera } from 'lucide-react';

export const DashboardPage = () => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setEventsLoading(true);
        
        // Fetch snapshots and events concurrently
        const [snapshotsData, eventsData] = await Promise.all([
          snapshotService.getSnapshots(),
          eventService.getEvents()
        ]);
        
        setSnapshots(snapshotsData);
        setRecentEvents(eventsData.slice(0, 5)); // Latest 5 events for dashboard
      } catch (err) {
        setError('Failed to fetch data. Please ensure the API server is running.');
      } finally {
        setLoading(false);
        setEventsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleReportGeneration = async (reportType: string, timeRange: string) => {
    try {
      await generateSecurityReport(reportType, timeRange);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Page Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 gradient-gold rounded-2xl flex items-center justify-center shadow-xl">
                <Camera size={32} style={{ color: 'hsl(var(--background))' }} />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gradient-gold mb-2">
                  System Snapshots
                </h1>
                <p className="text-muted-foreground flex items-center">
                  <Server className="h-4 w-4 mr-2" style={{ color: 'hsl(var(--primary-gold))' }} />
                  Real-time system monitoring and endpoint security status
                </p>
              </div>
            </div>
            <ReportGenerator onGenerateReport={handleReportGeneration} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {loading && (
              <div className="card p-12 text-center animate-fadeIn">
                <div className="relative inline-block">
                  <div className="animate-spin rounded-full h-16 w-16 border-4" style={{ borderColor: 'hsl(var(--border))' }}></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 absolute top-0 left-0" style={{ borderColor: 'hsl(var(--primary-gold))' }}></div>
                </div>
                <p className="mt-4 text-foreground font-medium">Loading system snapshots...</p>
              </div>
            )}

            {error && (
              <div className="card p-6 border-l-4 animate-fadeIn" style={{ borderLeftColor: 'hsl(var(--danger))' }}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--danger) / 0.2)' }}>
                      <AlertCircle size={24} style={{ color: 'hsl(var(--danger))' }} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'hsl(var(--danger))' }}>Error</h3>
                    <p style={{ color: 'hsl(var(--danger) / 0.9)' }}>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && snapshots.length === 0 && (
              <div className="card p-12 text-center animate-fadeIn">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                  <Server size={40} className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No Snapshots Found</h3>
                <p className="text-muted-foreground">Start monitoring your systems to see data here</p>
              </div>
            )}

            {!loading && !error && snapshots.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                {snapshots.map((snapshot) => (
                  <Link
                    key={snapshot.id}
                    to={`/endpoints/${snapshot.hostname}`}
                    className="card card-hover block"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 gradient-gold rounded-xl flex items-center justify-center shadow-lg">
                          <Server size={24} style={{ color: 'hsl(var(--background))' }} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">
                            {snapshot.hostname}
                          </h3>
                          <p className="text-sm text-muted-foreground">{snapshot.os}</p>
                        </div>
                      </div>
                      <ArrowRight className="text-muted-foreground flex-shrink-0" size={20} />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <span className="text-muted-foreground text-sm font-medium">Last Updated</span>
                        <span className="text-foreground font-semibold text-sm">
                          {new Date(snapshot.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            {/* Event Summary Card */}
            <div className="card h-full flex flex-col overflow-hidden">
              <div className="px-6 py-5 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 gradient-success rounded-lg flex items-center justify-center shadow-lg">
                      <Activity className="text-white" size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Recent Events</h2>
                  </div>
                  {!eventsLoading && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'hsl(var(--success) / 0.2)' }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'hsl(var(--success))' }}></div>
                      <span className="text-sm font-semibold" style={{ color: 'hsl(var(--success))' }}>Live</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {eventsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-4" style={{ borderColor: 'hsl(var(--border))' }}></div>
                      <div className="animate-spin rounded-full h-12 w-12 border-t-4 absolute top-0 left-0" style={{ borderColor: 'hsl(var(--success))' }}></div>
                    </div>
                  </div>
                ) : recentEvents.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center p-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                        <Activity size={32} className="text-muted-foreground" />
                      </div>
                      <p className="text-foreground font-medium">No recent events</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {recentEvents.map((event) => (
                      <div 
                        key={event.id} 
                        className="rounded-lg p-4 border transition-smooth hover:border-primary-gold"
                        style={{ 
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))'
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span 
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full`}
                            style={{
                              backgroundColor: event.severity === 'critical' 
                                ? 'hsl(var(--danger) / 0.2)'
                                : event.severity === 'high'
                                ? 'hsl(25 95% 15%)'
                                : event.severity === 'medium'
                                ? 'hsl(var(--warning) / 0.2)'
                                : 'hsl(var(--primary-gold) / 0.2)',
                              color: event.severity === 'critical'
                                ? 'hsl(var(--danger))'
                                : event.severity === 'high'
                                ? 'hsl(25 95% 60%)'
                                : event.severity === 'medium'
                                ? 'hsl(var(--warning))'
                                : 'hsl(var(--primary-gold))'
                            }}
                          >
                            {event.severity?.toUpperCase() || 'INFO'}
                          </span>
                          <span className="text-muted-foreground text-xs font-medium">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-foreground text-sm font-medium mb-2 line-clamp-2">
                          {event.details}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {event.hostname} • {event.type}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}>
                <Link
                  to="/events"
                  className="flex items-center justify-center gap-2 text-sm font-semibold group transition-smooth hover:text-accent-gold"
                  style={{ color: 'hsl(var(--primary-gold))' }}
                >
                  <TrendingUp size={16} />
                  View Live Event Feed
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
