import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Play, Clock, Activity, CheckCircle, XCircle, Eye, Settings, RefreshCw, Search } from 'lucide-react';
import { rootkitService, RootkitScan, RootkitAlert, RootkitStats } from '../services/rootkitApi';

interface RootkitDashboardProps {
  onManualScanTriggered?: (scanId: string) => void;
}

export const RootkitDashboard = ({ onManualScanTriggered }: RootkitDashboardProps) => {
  const [stats, setStats] = useState<RootkitStats | null>(null);
  const [recentScans, setRecentScans] = useState<RootkitScan[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<RootkitAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualScanLoading, setManualScanLoading] = useState(false);
  const [manualScanStatus, setManualScanStatus] = useState<string>('');
  const [selectedHostname, setSelectedHostname] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, scansData, alertsData] = await Promise.all([
        rootkitService.getStats(),
        rootkitService.getScans(20),
        rootkitService.getAlerts({ status: 'active' })
      ]);
      
      setStats(statsData);
      setRecentScans(scansData);
      setRecentAlerts(alertsData);
    } catch (error) {
      console.error('Failed to fetch rootkit data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const triggerManualScan = async () => {
    try {
      setManualScanLoading(true);
      setManualScanStatus('Initializing scan...');
      
      const result = await rootkitService.triggerManualScan(selectedHostname || undefined);
      
      setManualScanStatus(`Scan started: ${result.message}`);
      onManualScanTriggered?.(result.scanId);
      
      // Refresh data after starting scan
      setTimeout(fetchData, 2000);
      
      // Clear status after 5 seconds
      setTimeout(() => setManualScanStatus(''), 5000);
      
    } catch (error) {
      console.error('Failed to trigger manual scan:', error);
      setManualScanStatus('Failed to start scan. Please try again.');
      setTimeout(() => setManualScanStatus(''), 5000);
    } finally {
      setManualScanLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-500 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'running':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filteredAlerts = recentAlerts.filter(alert =>
    alert.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (alert.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.threat_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 hover-lift">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Scans</h3>
            <Activity className="h-4 w-4 text-primary-gold" />
          </div>
          <div className="text-2xl font-bold text-primary-gold">{stats?.total_scans || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            All time scans
          </p>
        </div>

        <div className="card p-6 hover-lift">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Active Threats</h3>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-500">{stats?.active_alerts || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.resolved_alerts || 0} resolved
          </p>
        </div>

        <div className="card p-6 hover-lift">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Clean Systems</h3>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-500">
            {stats?.severity_distribution 
              ? Object.values(stats.severity_distribution).reduce((a, b) => a + b, 0) 
              : 0
            }
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            threat types detected
          </p>
        </div>

        <div className="card p-6 hover-lift">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Next Scan</h3>
            <Clock className="h-4 w-4 text-accent-gold" />
          </div>
          <div className="text-lg font-bold text-accent-gold">
            {stats?.last_scan 
              ? new Date(stats.last_scan).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Never'
            }
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Last scan time
          </p>
        </div>
      </div>

      {/* Manual Scan Controls */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Manual Rootkit Scan</h3>
            <p className="text-sm text-muted-foreground">
              Trigger an immediate security scan to detect potential rootkit infections
            </p>
          </div>
          <Shield className="h-6 w-6 text-primary-gold" />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-1">
              Target Hostname (optional)
            </label>
            <input
              type="text"
              placeholder="Leave empty to scan all systems"
              value={selectedHostname}
              onChange={(e) => setSelectedHostname(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent"
            />
          </div>
          <button
            onClick={triggerManualScan}
            disabled={manualScanLoading}
            className={`px-6 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
              manualScanLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-gold text-background hover:bg-accent-gold hover-lift'
            }`}
          >
            {manualScanLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Scan
              </>
            )}
          </button>
        </div>
        
        {manualScanStatus && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">{manualScanStatus}</p>
          </div>
        )}
      </div>

      {/* Recent Scans and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scans */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Scans</h3>
            <button
              onClick={fetchData}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentScans.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent scans found</p>
            ) : (
              recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {scan.hostname}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(scan.status)}`}
                      >
                        {scan.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{new Date(scan.started_at).toLocaleString()}</span>
                      <span>{scan.duration ? `${scan.duration}s` : 'N/A'}</span>
                      <span>{scan.threats_found} threats</span>
                      <span className="capitalize">{scan.scan_type}</span>
                    </div>
                  </div>
                  {scan.threats_found > 0 && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Active Rootkit Alerts</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1 text-xs border border-border rounded bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary-gold"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {filteredAlerts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {searchTerm ? 'No matching alerts found' : 'No active alerts - system clean! ✅'}
              </p>
            ) : (
              filteredAlerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {alert.hostname}
                      </span>
                    </div>
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  </div>
                  
                  <div className="text-sm text-foreground mb-2">
                    <span className="font-medium">Threat:</span> {alert.threat_name}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2">
                    {alert.description && alert.description.length > 100 
                      ? `${alert.description.substring(0, 100)}...` 
                      : alert.description || 'No description available'
                    }
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {new Date(alert.detected_at).toLocaleString()}
                    </span>
                    <button className="text-primary-gold hover:text-accent-gold transition-colors flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Investigate
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Configuration Status */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Scanner Status</h3>
          <Settings className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            {stats?.total_scans && stats.total_scans > 0 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm text-foreground">
              Scanner {stats?.total_scans && stats.total_scans > 0 ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Last Scan:</span> {' '}
            {stats?.last_scan 
              ? new Date(stats.last_scan).toLocaleString()
              : 'Never'
            }
          </div>
          
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Active Alerts:</span> {stats?.active_alerts || 0}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Resolved:</span> {stats?.resolved_alerts || 0}
          </div>
        </div>
      </div>
    </div>
  );
};