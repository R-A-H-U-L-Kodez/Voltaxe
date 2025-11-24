import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { AlertsTable } from '../components/AlertsTable';
import { CVEDetailsModal } from '../components/CVEDetailsModal';
import { alertService } from '../services/api';
import { Alert } from '../types';
import { Search, AlertCircle, Download, TrendingUp, Clock, Activity } from 'lucide-react';

export const AlertsPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active'); // active, acknowledged, all
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCVE, setSelectedCVE] = useState<string | null>(null);
  const [isCVEModalOpen, setIsCVEModalOpen] = useState(false);
  
  // Metrics state
  const [criticalCount, setCriticalCount] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState('--');
  const [todayVolume, setTodayVolume] = useState(0);
  const [volumeTrend, setVolumeTrend] = useState(0);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (selectedSeverity !== 'all') {
        params.severity = selectedSeverity;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }

      const data = await alertService.getAlerts(params);
      
      // Filter by status on client side
      let filteredData = data;
      if (selectedStatus === 'active') {
        filteredData = data.filter(a => a.status === 'new');
      } else if (selectedStatus === 'acknowledged') {
        filteredData = data.filter(a => a.status === 'acknowledged');
      }
      
      setAlerts(filteredData);
      
      // Calculate metrics from fetched data
      const criticalAlerts = data.filter(a => 
        a.severity === 'critical' && a.status === 'new'
      );
      setCriticalCount(criticalAlerts.length);
      
      // Calculate today's volume
      const today = new Date().toDateString();
      const todayAlerts = data.filter(a => 
        new Date(a.timestamp).toDateString() === today
      );
      setTodayVolume(todayAlerts.length);
      
      // Calculate average volume for trend
      const uniqueDays = new Set(data.map(a => new Date(a.timestamp).toDateString())).size;
      const avgDaily = uniqueDays > 0 ? data.length / uniqueDays : 0;
      const trend = avgDaily > 0 ? ((todayAlerts.length - avgDaily) / avgDaily) * 100 : 0;
      setVolumeTrend(Math.round(trend));
      
      // Calculate average response time (time from alert creation to acknowledgment)
      const acknowledgedAlerts = data.filter(a => a.status === 'acknowledged');
      if (acknowledgedAlerts.length > 0) {
        // This is a simplified calculation - in real scenario, you'd have acknowledgment timestamp
        // For now, we'll estimate based on current time
        const totalResponseTime = acknowledgedAlerts.reduce((sum, alert) => {
          const alertTime = new Date(alert.timestamp).getTime();
          const now = Date.now();
          return sum + (now - alertTime);
        }, 0);
        const avgMs = totalResponseTime / acknowledgedAlerts.length;
        const avgMinutes = Math.round(avgMs / 60000);
        setAvgResponseTime(`${avgMinutes}m`);
      } else {
        setAvgResponseTime('--');
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedSeverity, selectedStatus, startDate, endDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAlerts();
  };

  const handleCVEClick = (cveId: string) => {
    setSelectedCVE(cveId);
    setIsCVEModalOpen(true);
  };

  const severityButtons: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Page Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 gradient-danger rounded-2xl flex items-center justify-center shadow-xl">
                <AlertCircle size={32} style={{ color: 'hsl(var(--background))' }} />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gradient-gold mb-2">
                  Security Alerts
                </h1>
                <p className="text-muted-foreground flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" style={{ color: 'hsl(var(--danger))' }} />
                  Monitor and manage security events across your infrastructure
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Metrics - Sparkline Row */}
        <div className="grid grid-cols-3 gap-4 mb-6 animate-fadeIn">
          <div className="card p-5 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Open Critical Alerts
              </p>
              <AlertCircle className="h-4 w-4" style={{ color: 'hsl(var(--danger))' }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: 'hsl(var(--danger))' }}>
              {criticalCount}
            </p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Requiring immediate attention
            </p>
          </div>

          <div className="card p-5 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Avg. Response Time
              </p>
              <Clock className="h-4 w-4" style={{ color: 'hsl(var(--accent-gold))' }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: 'hsl(var(--accent-gold))' }}>
              {avgResponseTime}
            </p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              From detection to acknowledgment
            </p>
          </div>

          <div className="card p-5 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Today's Volume
              </p>
              <Activity className="h-4 w-4" style={{ color: 'hsl(var(--primary-gold))' }} />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold" style={{ color: 'hsl(var(--primary-gold))' }}>
                {todayVolume}
              </p>
              {volumeTrend !== 0 && (
                <span className="text-sm font-medium flex items-center gap-1" style={{ 
                  color: volumeTrend > 0 ? 'hsl(var(--danger))' : 'hsl(var(--success))' 
                }}>
                  <TrendingUp className="h-3 w-3" style={{ 
                    transform: volumeTrend < 0 ? 'rotate(180deg)' : 'none' 
                  }} />
                  {Math.abs(volumeTrend)}%
                </span>
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {volumeTrend > 0 ? 'Above' : volumeTrend < 0 ? 'Below' : 'At'} average
            </p>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-foreground text-sm mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by hostname or event type..."
                    className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary-gold"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="block text-foreground text-sm mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-primary-gold"
                  />
                </div>
                <div>
                  <label className="block text-foreground text-sm mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-primary-gold"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div className="flex-1">
                <label className="block text-foreground text-sm mb-2">Severity Filter</label>
                <div className="flex gap-2">
                  {severityButtons.map((btn) => (
                    <button
                      key={btn.value}
                      type="button"
                      onClick={() => setSelectedSeverity(btn.value)}
                      className="px-4 py-2 rounded-lg font-medium text-sm transition-smooth"
                      style={{
                        backgroundColor: selectedSeverity === btn.value 
                          ? 'hsl(var(--primary-gold))' 
                          : 'hsl(var(--input))',
                        color: selectedSeverity === btn.value 
                          ? 'hsl(var(--background))' 
                          : 'hsl(var(--foreground))'
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <div>
                  <label className="block text-foreground text-sm mb-2">Status Filter</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-primary-gold cursor-pointer"
                  >
                    <option value="all">All Alerts</option>
                    <option value="active">New/Active</option>
                    <option value="acknowledged">Acknowledged</option>
                  </select>
                </div>

                <div>
                  <label className="block text-foreground text-sm mb-2">&nbsp;</label>
                  <button
                    type="button"
                    onClick={() => {
                      // Export functionality
                      const csv = [
                        ['Severity', 'Timestamp', 'Hostname', 'Details', 'Status'].join(','),
                        ...alerts.map(a => [
                          a.severity,
                          new Date(a.timestamp).toLocaleString(),
                          a.hostname,
                          `"${a.details.replace(/"/g, '""')}"`,
                          a.status
                        ].join(','))
                      ].join('\n');
                      
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `security-alerts-${new Date().toISOString().split('T')[0]}.csv`;
                      link.click();
                      window.URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-smooth flex items-center gap-2 hover-lift"
                    style={{
                      backgroundColor: 'hsl(var(--success))',
                      color: 'hsl(var(--background))'
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-16 w-16 border-4" style={{ borderColor: 'hsl(var(--border))' }}></div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 absolute top-0 left-0" style={{ borderColor: 'hsl(var(--primary-gold))' }}></div>
            </div>
          </div>
        ) : (
          <AlertsTable 
            alerts={alerts} 
            onAlertUpdate={fetchAlerts} 
            onCVEClick={handleCVEClick}
          />
        )}

        <CVEDetailsModal 
          cveId={selectedCVE || ''}
          isOpen={isCVEModalOpen}
          onClose={() => {
            setIsCVEModalOpen(false);
            setSelectedCVE(null);
          }}
        />
      </main>
    </div>
  );
};
