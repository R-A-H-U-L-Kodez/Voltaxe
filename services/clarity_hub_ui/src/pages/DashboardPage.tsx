import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ReportGenerator } from '../components/ReportGenerator';
import { snapshotService, eventService } from '../services/api';
import { generateSecurityReport } from '../utils/reportGenerator';
import { Snapshot, Event } from '../types';
import { Server, AlertCircle, Loader2, Activity, ArrowRight, TrendingUp } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">System Snapshots</h1>
            <p className="text-foreground/70">Monitor your infrastructure security status</p>
          </div>
          <ReportGenerator onGenerateReport={handleReportGeneration} />
        </div>        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-foreground mb-4">System Snapshots</h2>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="text-primary-gold animate-spin" size={48} />
              </div>
            )}

            {error && (
              <div className="bg-danger/10 border border-danger rounded-lg p-6 flex items-start gap-3">
                <AlertCircle className="text-danger flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="text-danger font-semibold mb-1">Error</h3>
                  <p className="text-danger/90">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && snapshots.length === 0 && (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <Server className="text-foreground/30 mx-auto mb-4" size={48} />
                <h3 className="text-foreground text-lg mb-2">No snapshots found</h3>
                <p className="text-foreground/60">Start monitoring your systems to see data here</p>
              </div>
            )}

            {!loading && !error && snapshots.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {snapshots.map((snapshot) => (
                  <Link
                    key={snapshot.id}
                    to={`/endpoints/${snapshot.hostname}`}
                    className="bg-card border border-border rounded-lg p-6 shadow-surface hover:shadow-primary hover:border-primary-gold/30 block"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-gold/10 rounded-lg flex items-center justify-center">
                          <Server className="text-primary-gold" size={20} />
                        </div>
                        <div>
                          <h3 className="text-primary-gold font-semibold text-lg">
                            {snapshot.hostname}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-foreground/70 text-sm">Operating System</span>
                        <span className="text-foreground font-medium">{snapshot.os}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-foreground/70 text-sm">Last Updated</span>
                        <span className="text-foreground font-medium">
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
            <div className="bg-card border border-border rounded-lg shadow-surface h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Activity className="text-primary-gold" size={20} />
                  <h2 className="text-xl font-semibold text-foreground">Recent Events</h2>
                </div>
                {!eventsLoading && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <span className="text-success text-sm">Live</span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {eventsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-3">
                      <Loader2 className="text-primary-gold animate-spin" size={20} />
                      <span className="text-foreground/70 text-sm">Loading events...</span>
                    </div>
                  </div>
                ) : recentEvents.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center p-6">
                      <Activity className="text-foreground/30 mx-auto mb-3" size={32} />
                      <p className="text-foreground/60 text-sm">No recent events</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2">
                    {recentEvents.map((event) => (
                      <div key={event.id} className="p-3 mb-2 rounded-lg hover:bg-white/5">
                        <div className="flex items-start justify-between mb-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                            event.severity === 'critical' ? 'bg-danger/20 text-danger' :
                            event.severity === 'high' ? 'bg-warning/20 text-warning' :
                            event.severity === 'medium' ? 'bg-primary-gold/20 text-primary-gold' :
                            'bg-foreground/20 text-foreground'
                          }`}>
                            {event.severity?.toUpperCase() || 'MEDIUM'}
                          </span>
                          <span className="text-foreground/40 text-xs">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-foreground text-sm mb-1 line-clamp-2">
                          {event.details}
                        </p>
                        <p className="text-foreground/60 text-xs">
                          {event.hostname} • {event.type}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border">
                <Link
                  to="/events"
                  className="flex items-center justify-center gap-2 text-primary-gold hover:text-accent-gold text-sm font-medium group"
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
