import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { snapshotService } from '../services/api';
import { Snapshot } from '../types';
import { 
  Server, 
  Search, 
  Filter,
  MoreVertical,
  Shield,
  Activity,
  AlertTriangle,
  Power,
  Eye,
  Scan,
  Ban,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Monitor,
  Globe,
  Camera
} from 'lucide-react';

// OS Icon Component
const getOSIcon = (os: string) => {
  const osLower = os.toLowerCase();
  if (osLower.includes('windows')) return <Monitor className="h-8 w-8" style={{ color: 'hsl(var(--primary-gold))' }} />;
  if (osLower.includes('linux')) return <Server className="h-8 w-8" style={{ color: 'hsl(var(--primary-gold))' }} />;
  if (osLower.includes('mac') || osLower.includes('darwin')) return <Monitor className="h-8 w-8" style={{ color: 'hsl(var(--primary-gold))' }} />;
  if (osLower.includes('ubuntu')) return <Server className="h-8 w-8" style={{ color: 'hsl(var(--warning))' }} />;
  if (osLower.includes('centos') || osLower.includes('rhel')) return <Server className="h-8 w-8" style={{ color: 'hsl(var(--danger))' }} />;
  return <Monitor className="h-8 w-8" style={{ color: 'hsl(var(--muted-foreground))' }} />;
};

// Risk level color mapping
const getRiskColor = (level: string) => {
  switch (level.toUpperCase()) {
    case 'CRITICAL': return 'hsl(var(--danger))';
    case 'HIGH': return 'hsl(var(--warning))';
    case 'MEDIUM': return 'hsl(var(--accent-gold))';
    case 'LOW': return 'hsl(var(--success))';
    default: return 'hsl(var(--muted-foreground))';
  }
};

export const SnapshotsPage = () => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [filteredSnapshots, setFilteredSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [osFilter, setOsFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchSnapshots();
    const interval = setInterval(fetchSnapshots, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [snapshots, searchQuery, osFilter, statusFilter, riskFilter]);

  const fetchSnapshots = async () => {
    try {
      setLoading(true);
      const data = await snapshotService.getSnapshots();
      setSnapshots(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch snapshots. Please ensure the API server is running.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...snapshots];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.hostname.toLowerCase().includes(query) ||
        s.os.toLowerCase().includes(query) ||
        (s.ipAddress && s.ipAddress.toLowerCase().includes(query))
      );
    }

    // OS filter
    if (osFilter !== 'all') {
      filtered = filtered.filter(s => s.os.toLowerCase().includes(osFilter.toLowerCase()));
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(s => s.riskLevel === riskFilter.toUpperCase());
    }

    setFilteredSnapshots(filtered);
  };

  const handleQuickAction = (action: string, snapshot: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`${action} triggered for ${snapshot.hostname}`);
    setActiveMenu(null);
    // TODO: Implement actual actions
  };

  const toggleMenu = (snapshotId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu(activeMenu === snapshotId ? null : snapshotId);
  };

  const uniqueOSList = [...new Set(snapshots.map(s => s.os.split(' ')[0]))];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Page Header */}
        <div className="mb-6 animate-fadeIn">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 gradient-gold rounded-2xl flex items-center justify-center shadow-xl">
              <Camera size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient-gold">Snapshots</h1>
              <p className="mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Real-time endpoint monitoring and system status
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="card p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <input
                  type="text"
                  placeholder="Search by hostname, OS, or IP address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                />
              </div>

              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors hover-lift"
                style={{
                  backgroundColor: showFilters ? 'hsl(var(--primary-gold))' : 'hsl(var(--muted))',
                  borderColor: showFilters ? 'hsl(var(--primary-gold))' : 'hsl(var(--border))',
                  color: showFilters ? 'white' : 'hsl(var(--foreground))',
                }}
              >
                <Filter className="h-5 w-5" />
                <span className="font-medium">Filters</span>
                {(osFilter !== 'all' || statusFilter !== 'all' || riskFilter !== 'all') && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-black">
                    {[osFilter !== 'all', statusFilter !== 'all', riskFilter !== 'all'].filter(Boolean).length}
                  </span>
                )}
              </button>

              {/* Refresh Button */}
              <button
                onClick={fetchSnapshots}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors hover-lift"
                style={{
                  backgroundColor: 'hsl(var(--muted))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
              >
                <RefreshCw className="h-5 w-5" />
                <span className="font-medium hidden lg:inline">Refresh</span>
              </button>
            </div>

            {/* Filter Dropdowns */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                {/* OS Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                    Operating System
                  </label>
                  <select
                    value={osFilter}
                    onChange={(e) => setOsFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                  >
                    <option value="all">All Operating Systems</option>
                    {uniqueOSList.map(os => (
                      <option key={os} value={os}>{os}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                {/* Risk Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                    Risk Level
                  </label>
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)' }}>
                  <Server className="h-5 w-5" style={{ color: 'hsl(var(--primary-gold))' }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Endpoints</p>
                  <p className="text-2xl font-bold" style={{ color: 'hsl(var(--primary-gold))' }}>{snapshots.length}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--success) / 0.1)' }}>
                  <CheckCircle className="h-5 w-5" style={{ color: 'hsl(var(--success))' }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Online</p>
                  <p className="text-2xl font-bold" style={{ color: 'hsl(var(--success))' }}>
                    {snapshots.filter(s => s.status === 'online').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--danger) / 0.1)' }}>
                  <XCircle className="h-5 w-5" style={{ color: 'hsl(var(--danger))' }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Offline</p>
                  <p className="text-2xl font-bold" style={{ color: 'hsl(var(--danger))' }}>
                    {snapshots.filter(s => s.status === 'offline').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--warning) / 0.1)' }}>
                  <AlertTriangle className="h-5 w-5" style={{ color: 'hsl(var(--warning))' }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>High Risk</p>
                  <p className="text-2xl font-bold" style={{ color: 'hsl(var(--warning))' }}>
                    {snapshots.filter(s => s.riskLevel === 'HIGH' || s.riskLevel === 'CRITICAL').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Endpoint Cards Grid */}
        {loading && (
          <div className="card p-12 text-center animate-fadeIn">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-16 w-16 border-4" style={{ borderColor: 'hsl(var(--border))' }}></div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 absolute top-0 left-0" style={{ borderColor: 'hsl(var(--primary-gold))' }}></div>
            </div>
            <p className="mt-4 font-medium" style={{ color: 'hsl(var(--foreground))' }}>Loading fleet data...</p>
          </div>
        )}

        {error && (
          <div className="card p-6 border-l-4 animate-fadeIn" style={{ borderLeftColor: 'hsl(var(--danger))' }}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={24} style={{ color: 'hsl(var(--danger))' }} />
              <div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'hsl(var(--danger))' }}>Error</h3>
                <p style={{ color: 'hsl(var(--danger) / 0.9)' }}>{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && filteredSnapshots.length === 0 && (
          <div className="card p-12 text-center animate-fadeIn">
            <Server size={48} className="mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>No Endpoints Found</h3>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>
              {searchQuery || osFilter !== 'all' || statusFilter !== 'all' || riskFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start monitoring endpoints to see them here'}
            </p>
          </div>
        )}

        {!loading && !error && filteredSnapshots.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fadeIn">
            {filteredSnapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="card card-hover relative"
                onClick={() => window.location.href = `/endpoints/${snapshot.hostname}`}
                style={{ cursor: 'pointer' }}
              >
                {/* Status Indicator - Top Right */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${snapshot.status === 'online' ? 'animate-pulse' : ''}`}
                    style={{
                      backgroundColor: snapshot.status === 'online' ? 'hsl(var(--success))' : 'hsl(var(--danger))',
                      boxShadow: snapshot.status === 'online' ? '0 0 10px hsl(var(--success))' : 'none'
                    }}
                  />
                  <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {snapshot.status}
                  </span>
                </div>

                {/* Quick Actions Menu */}
                <div className="absolute top-4 right-16">
                  <button
                    onClick={(e) => toggleMenu(snapshot.id, e)}
                    className="p-1.5 rounded-lg hover:bg-opacity-10 transition-colors"
                    style={{ backgroundColor: activeMenu === snapshot.id ? 'hsl(var(--muted))' : 'transparent' }}
                  >
                    <MoreVertical className="h-5 w-5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  </button>
                  
                  {activeMenu === snapshot.id && (
                    <div 
                      className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl z-10 border"
                      style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    >
                      <button
                        onClick={(e) => handleQuickAction('scan', snapshot, e)}
                        className="w-full px-4 py-2 text-left hover:bg-opacity-5 flex items-center gap-2 transition-colors"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        <Scan className="h-4 w-4" />
                        <span>Trigger Scan</span>
                      </button>
                      <button
                        onClick={(e) => handleQuickAction('details', snapshot, e)}
                        className="w-full px-4 py-2 text-left hover:bg-opacity-5 flex items-center gap-2 transition-colors"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={(e) => handleQuickAction('isolate', snapshot, e)}
                        className="w-full px-4 py-2 text-left hover:bg-opacity-5 flex items-center gap-2 transition-colors"
                        style={{ color: 'hsl(var(--danger))' }}
                      >
                        <Ban className="h-4 w-4" />
                        <span>Isolate</span>
                      </button>
                      <button
                        onClick={(e) => handleQuickAction('report', snapshot, e)}
                        className="w-full px-4 py-2 text-left hover:bg-opacity-5 flex items-center gap-2 transition-colors"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        <Download className="h-4 w-4" />
                        <span>Export Report</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="pt-8">
                  {/* Hostname & OS */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-4xl">{getOSIcon(snapshot.os)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold truncate" style={{ color: 'hsl(var(--foreground))' }}>
                        {snapshot.hostname}
                      </h3>
                      <p className="text-sm truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {snapshot.os}
                      </p>
                    </div>
                  </div>

                  {/* Risk Badge */}
                  <div className="mb-4">
                    <span
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: `${getRiskColor(snapshot.riskLevel || 'LOW')}20`,
                        color: getRiskColor(snapshot.riskLevel || 'LOW'),
                        border: `1px solid ${getRiskColor(snapshot.riskLevel || 'LOW')}40`
                      }}
                    >
                      <Shield className="h-3 w-3" />
                      {snapshot.riskLevel || snapshot.risk_category || 'LOW'} RISK
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <Globe className="h-4 w-4" />
                        IP Address
                      </span>
                      <span className="font-mono font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                        {snapshot.ipAddress || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <Activity className="h-4 w-4" />
                        Agent
                      </span>
                      <span className="font-mono font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                        {snapshot.agentVersion || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <AlertTriangle className="h-4 w-4" />
                        Vulnerabilities
                      </span>
                      <span 
                        className="font-bold"
                        style={{ color: (snapshot.vulnerabilities || 0) > 10 ? 'hsl(var(--danger))' : 'hsl(var(--success))' }}
                      >
                        {snapshot.vulnerabilities || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                      <span className="flex items-center gap-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <Power className="h-4 w-4" />
                        Last Seen
                      </span>
                      <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                        {snapshot.lastSeen ? new Date(snapshot.lastSeen).toLocaleTimeString() : new Date(snapshot.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
