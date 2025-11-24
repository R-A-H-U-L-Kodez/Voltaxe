import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Shield } from 'lucide-react';
import { FleetHealthCards } from '../FleetHealthCards';
import { FleetSearchFilters } from '../FleetSearchFilters';
import { EndpointCard } from '../EndpointCard';
import { endpointService } from '../../services/api';
import { Endpoint, FleetMetrics, EndpointStatus, EndpointRisk, OSType } from '../../types';

export const FleetLiveView = () => {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [metrics, setMetrics] = useState<FleetMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EndpointStatus | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<EndpointRisk | 'all'>('all');
  const [osFilter, setOSFilter] = useState<OSType | 'all'>('all');

  // Action states
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchFleetData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [endpointsData, metricsData] = await Promise.all([
        endpointService.getAllEndpoints(),
        endpointService.getFleetMetrics(),
      ]);

      setEndpoints(endpointsData);
      setMetrics(metricsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load fleet data. Please ensure the API server is running.');
      setEndpoints([]);
      setMetrics(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFleetData();
    const interval = setInterval(() => fetchFleetData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((endpoint) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          endpoint.hostname.toLowerCase().includes(query) ||
          endpoint.ip_address.toLowerCase().includes(query) ||
          endpoint.os.toLowerCase().includes(query) ||
          endpoint.os_version.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (statusFilter !== 'all' && endpoint.status !== statusFilter) return false;
      if (riskFilter !== 'all' && endpoint.risk_level !== riskFilter) return false;
      if (osFilter !== 'all' && endpoint.os_type !== osFilter) return false;
      return true;
    });
  }, [endpoints, searchQuery, statusFilter, riskFilter, osFilter]);

  const handleRefresh = () => {
    fetchFleetData(true);
  };

  const handleQuickScan = async (endpointId: string) => {
    setActionMessage(null);
    try {
      await endpointService.quickScan(endpointId);
      setActionMessage({ type: 'success', message: 'Scan initiated successfully' });
      setTimeout(() => fetchFleetData(true), 2000);
    } catch (err: any) {
      setActionMessage({ type: 'error', message: 'Failed to initiate scan' });
    } finally {
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleIsolate = async (endpointId: string) => {
    const endpoint = endpoints.find((e) => e.id === endpointId);
    if (!endpoint) return;
    const confirmMsg = `Are you sure you want to ISOLATE ${endpoint.hostname}? This will cut network access immediately.`;
    if (!window.confirm(confirmMsg)) return;
    setActionMessage(null);
    try {
      await endpointService.isolateEndpointById(endpointId);
      setActionMessage({ type: 'success', message: `${endpoint.hostname} isolated successfully` });
      fetchFleetData(true);
    } catch (err: any) {
      setActionMessage({ type: 'error', message: 'Failed to isolate endpoint' });
    } finally {
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleUnisolate = async (endpointId: string) => {
    const endpoint = endpoints.find((e) => e.id === endpointId);
    if (!endpoint) return;
    const confirmMsg = `Remove isolation for ${endpoint.hostname}?`;
    if (!window.confirm(confirmMsg)) return;
    setActionMessage(null);
    try {
      await endpointService.unisolateEndpoint(endpointId);
      setActionMessage({ type: 'success', message: `${endpoint.hostname} isolation removed` });
      fetchFleetData(true);
    } catch (err: any) {
      setActionMessage({ type: 'error', message: 'Failed to remove isolation' });
    } finally {
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-16 w-16 animate-spin mx-auto mb-4" style={{ color: 'hsl(var(--primary-gold))' }} />
          <p className="text-lg" style={{ color: 'hsl(var(--foreground))' }}>Loading Live Fleet Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Action Message */}
      {actionMessage && (
        <div
          className="mb-6 p-4 rounded-lg flex items-center gap-3"
          style={{
            backgroundColor: actionMessage.type === 'success' ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--danger) / 0.1)',
            border: `1px solid ${actionMessage.type === 'success' ? 'hsl(var(--success) / 0.3)' : 'hsl(var(--danger) / 0.3)'}`,
          }}
        >
          <AlertCircle
            className="h-5 w-5"
            style={{ color: actionMessage.type === 'success' ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}
          />
          <p style={{ color: actionMessage.type === 'success' ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
            {actionMessage.message}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="mb-6 p-4 rounded-lg flex items-center gap-3"
          style={{
            backgroundColor: 'hsl(var(--warning) / 0.1)',
            border: '1px solid hsl(var(--warning) / 0.3)',
          }}
        >
          <AlertCircle className="h-5 w-5" style={{ color: 'hsl(var(--warning))' }} />
          <p style={{ color: 'hsl(var(--warning))' }}>{error}</p>
        </div>
      )}

      {/* Fleet Health Cards */}
      {metrics && <FleetHealthCards metrics={metrics} loading={refreshing} />}

      {/* Search & Filters */}
      <FleetSearchFilters
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
        onRiskChange={setRiskFilter}
        onOSChange={setOSFilter}
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
      />

      {/* Endpoints Grid */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
          Live Endpoints <span style={{ color: 'hsl(var(--muted-foreground))' }}>({filteredEndpoints.length})</span>
        </h2>
      </div>

      {filteredEndpoints.length === 0 ? (
        <div className="card p-12 text-center">
          <Shield className="h-16 w-16 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
            No Endpoints Found
          </h3>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>
            {searchQuery || statusFilter !== 'all' || riskFilter !== 'all' || osFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No endpoints registered yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEndpoints.map((endpoint) => (
            <EndpointCard
              key={endpoint.id}
              endpoint={endpoint}
              onQuickScan={handleQuickScan}
              onIsolate={handleIsolate}
              onUnisolate={handleUnisolate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
