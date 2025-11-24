import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { snapshotService } from '../../services/api';
import { Snapshot } from '../../types';
import { 
  Search, 
  Filter,
  MoreVertical,
  Shield,
  AlertTriangle,
  Eye,
  Scan,
  Ban,
  RefreshCw,
  Server,
  Monitor,
} from 'lucide-react';

const getOSIcon = (os: string) => {
  const osLower = os.toLowerCase();
  if (osLower.includes('linux') || osLower.includes('ubuntu') || osLower.includes('centos') || osLower.includes('rhel')) {
    return <Server className="h-8 w-8" style={{ color: 'hsl(var(--primary-gold))' }} />;
  }
  return <Monitor className="h-8 w-8" style={{ color: 'hsl(var(--primary-gold))' }} />;
};

const getRiskColor = (level: string) => {
  switch (level?.toUpperCase()) {
    case 'CRITICAL': return 'hsl(var(--danger))';
    case 'HIGH': return 'hsl(var(--warning))';
    case 'MEDIUM': return 'hsl(var(--accent-gold))';
    case 'LOW': return 'hsl(var(--success))';
    default: return 'hsl(var(--muted-foreground))';
  }
};

export const FleetSnapshotsView = () => {
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [filteredSnapshots, setFilteredSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [osFilter, setOsFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSnapshots();
    const interval = setInterval(() => fetchSnapshots(true), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [snapshots, searchQuery, osFilter, statusFilter, riskFilter]);

  const fetchSnapshots = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await snapshotService.getSnapshots();
      setSnapshots(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch snapshots. Please ensure the API server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...snapshots];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.hostname.toLowerCase().includes(query) ||
        s.os.toLowerCase().includes(query) ||
        (s.ipAddress && s.ipAddress.toLowerCase().includes(query))
      );
    }

    if (osFilter !== 'all') {
      filtered = filtered.filter(s => s.os.toLowerCase().includes(osFilter.toLowerCase()));
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    if (riskFilter !== 'all') {
      filtered = filtered.filter(s => s.riskLevel === riskFilter.toUpperCase() || s.risk_category === riskFilter.toUpperCase());
    }

    setFilteredSnapshots(filtered);
  };

  const handleQuickAction = (action: string, snapshot: Snapshot, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`${action} triggered for ${snapshot.hostname}`);
    setActiveMenu(null);
  };

  const toggleMenu = (snapshotId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu(activeMenu === snapshotId ? null : snapshotId);
  };

  const uniqueOSList = [...new Set(snapshots.map(s => s.os.split(' ')[0]))];

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-16 w-16 animate-spin mx-auto mb-4" style={{ color: 'hsl(var(--primary-gold))' }} />
          <p className="text-lg" style={{ color: 'hsl(var(--foreground))' }}>Loading Security Snapshots...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Error Message */}
      {error && (
        <div
          className="mb-6 p-4 rounded-lg flex items-center gap-3"
          style={{
            backgroundColor: 'hsl(var(--danger) / 0.1)',
            border: '1px solid hsl(var(--danger) / 0.3)',
          }}
        >
          <AlertTriangle className="h-5 w-5" style={{ color: 'hsl(var(--danger))' }} />
          <p style={{ color: 'hsl(var(--danger))' }}>{error}</p>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input
              type="text"
              placeholder="Search by hostname, IP, or OS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border transition-smooth"
              style={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-smooth hover:opacity-80"
            style={{
              backgroundColor: showFilters ? 'hsl(var(--primary-gold))' : 'hsl(var(--muted))',
              color: showFilters ? 'white' : 'hsl(var(--foreground))',
            }}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>

          <button
            onClick={() => fetchSnapshots(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-smooth hover:opacity-80"
            style={{
              backgroundColor: 'hsl(var(--accent-gold))',
              color: 'white',
            }}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>OS Type</label>
              <select
                value={osFilter}
                onChange={(e) => setOsFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
              >
                <option value="all">All OS</option>
                {uniqueOSList.map((os) => (
                  <option key={os} value={os}>{os}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
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

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Risk Level</label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
              >
                <option value="all">All Risks</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Snapshots Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
          Security Snapshots <span style={{ color: 'hsl(var(--muted-foreground))' }}>({filteredSnapshots.length})</span>
        </h2>
      </div>

      {/* Snapshots Grid */}
      {filteredSnapshots.length === 0 ? (
        <div className="card p-12 text-center">
          <Shield className="h-16 w-16 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>No Snapshots Found</h3>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>
            {searchQuery || osFilter !== 'all' || statusFilter !== 'all' || riskFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No security snapshots available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSnapshots.map((snapshot) => {
            const riskLevel = snapshot.riskLevel || snapshot.risk_category || 'MEDIUM';
            const riskColor = getRiskColor(riskLevel);
            const isOnline = snapshot.status === 'online';

            return (
              <div
                key={snapshot.id}
                onClick={() => navigate(`/endpoints/${snapshot.hostname}`)}
                className="card p-5 hover:shadow-xl transition-all duration-300 relative group cursor-pointer"
                style={{
                  backgroundColor: 'hsl(var(--card))',
                  border: `2px solid ${isOnline ? 'hsl(var(--success) / 0.3)' : 'hsl(var(--border))'}`,
                }}
              >
                {/* Status Dot */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{
                      backgroundColor: isOnline ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))',
                      boxShadow: `0 0 10px ${isOnline ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))'}`,
                    }}
                  />
                  {/* Context Menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => toggleMenu(snapshot.id, e)}
                      className="p-1 rounded-lg hover:bg-opacity-80 transition-smooth opacity-0 group-hover:opacity-100"
                      style={{ backgroundColor: 'hsl(var(--muted))' }}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {activeMenu === snapshot.id && (
                      <div
                        className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl z-50 py-2"
                        style={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                        }}
                      >
                        <button
                          onClick={(e) => handleQuickAction('view', snapshot, e)}
                          className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-opacity-80"
                          style={{ color: 'hsl(var(--foreground))' }}
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                        <button
                          onClick={(e) => handleQuickAction('scan', snapshot, e)}
                          className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-opacity-80"
                          style={{ color: 'hsl(var(--primary-gold))' }}
                        >
                          <Scan className="h-4 w-4" />
                          Quick Scan
                        </button>
                        <button
                          onClick={(e) => handleQuickAction('isolate', snapshot, e)}
                          className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-opacity-80"
                          style={{ color: 'hsl(var(--danger))' }}
                        >
                          <Ban className="h-4 w-4" />
                          Isolate
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                    {getOSIcon(snapshot.os)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold truncate mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                      {snapshot.hostname}
                    </h3>
                    <p className="text-sm truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {snapshot.os}
                    </p>
                  </div>
                </div>

                {/* IP Address */}
                {snapshot.ipAddress && (
                  <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                    <p className="text-sm font-mono font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                      {snapshot.ipAddress}
                    </p>
                  </div>
                )}

                {/* Security State */}
                <div className="space-y-3 mb-4">
                  <div
                    className="inline-flex px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: riskColor + '20',
                      color: riskColor,
                      border: `1px solid ${riskColor}`,
                    }}
                  >
                    {riskLevel} RISK
                  </div>

                  {snapshot.vulnerabilities !== undefined && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(var(--warning))' }} />
                      <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                        {snapshot.vulnerabilities} Vulnerabilities
                      </span>
                    </div>
                  )}

                  {snapshot.resilience_score !== undefined && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" style={{ color: 'hsl(var(--primary-gold))' }} />
                      <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                        Score: {snapshot.resilience_score}/100
                      </span>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="pt-3 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {new Date(snapshot.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
