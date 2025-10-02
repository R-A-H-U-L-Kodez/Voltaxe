import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { endpointService } from '../services/api';
import { EndpointDetail } from '../types';
import { Loader2, AlertCircle, Scan, ShieldAlert, Activity, Package, Clock, Search } from 'lucide-react';
import { formatDistanceToNow } from '../utils/dateUtils';

type TabType = 'overview' | 'software' | 'events';

export const EndpointDetailPage = () => {
  const { hostname } = useParams<{ hostname: string }>();
  const [endpoint, setEndpoint] = useState<EndpointDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [softwareSearch, setSoftwareSearch] = useState('');
  const [showIsolateModal, setShowIsolateModal] = useState(false);
  const [isolating, setIsolating] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const fetchEndpoint = async () => {
      if (!hostname) return;

      try {
        setLoading(true);
        const data = await endpointService.getEndpointDetail(hostname);
        setEndpoint(data);
      } catch (err) {
        setError('Failed to fetch endpoint details');
      } finally {
        setLoading(false);
      }
    };

    fetchEndpoint();
  }, [hostname]);

  const filteredSoftware = endpoint?.software.filter((sw) =>
    sw.name.toLowerCase().includes(softwareSearch.toLowerCase()) ||
    (sw.publisher && sw.publisher.toLowerCase().includes(softwareSearch.toLowerCase()))
  ) || [];

  const handleScanNow = async () => {
    if (!hostname) return;
    setScanning(true);
    try {
      const result = await endpointService.scanEndpoint(hostname);
      alert(`✅ ${result.message}`);
      console.log('✅ Scan initiated successfully:', result);
    } catch (error: any) {
      console.error('Scan failed:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to initiate scan. Please try again.';
      alert(`❌ ${errorMessage}`);
    } finally {
      setScanning(false);
    }
  };

  const handleIsolateEndpoint = async () => {
    if (!hostname) return;
    setIsolating(true);
    try {
      const result = await endpointService.isolateEndpoint(hostname);
      alert(`🚨 ${result.message}`);
      console.log('🚨 Isolation completed:', result);
      setShowIsolateModal(false);
      // Refresh endpoint data to show updated status
      const refreshedData = await endpointService.getEndpointDetail(hostname);
      setEndpoint(refreshedData);
    } catch (error: any) {
      console.error('Isolation failed:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to isolate endpoint. Please try again.';
      alert(`❌ ${errorMessage}`);
    } finally {
      setIsolating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-primary-gold animate-spin" size={48} />
          </div>
        </main>
      </div>
    );
  }

  if (error || !endpoint) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="bg-danger/10 border border-danger rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="text-danger flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="text-danger font-semibold mb-1">Error</h3>
              <p className="text-danger/90">{error || 'Endpoint not found'}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Endpoint: {endpoint.hostname}
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-foreground/70">{endpoint.os}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                endpoint.status === 'online'
                  ? 'bg-success/10 text-success border border-success'
                  : 'bg-foreground/10 text-foreground border border-foreground/30'
              }`}>
                {endpoint.status.toUpperCase()}
              </span>
              <span className="text-foreground/70">
                Last seen: {formatDistanceToNow(endpoint.lastSeen)}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleScanNow}
              disabled={scanning}
              className="px-6 py-3 bg-primary-gold text-background rounded-lg font-semibold hover:shadow-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanning ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Scan size={18} />
              )}
              {scanning ? 'Scanning...' : 'Scan Now'}
            </button>
            <button 
              onClick={() => setShowIsolateModal(true)}
              className="px-6 py-3 bg-danger text-white rounded-lg font-semibold hover:shadow-lg flex items-center gap-2"
            >
              <ShieldAlert size={18} />
              Isolate Endpoint
            </button>
          </div>
        </div>

        <div className="border-b border-border mb-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'overview'
                  ? 'text-primary-gold border-b-2 border-primary-gold'
                  : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('software')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'software'
                  ? 'text-primary-gold border-b-2 border-primary-gold'
                  : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              Software
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'events'
                  ? 'text-primary-gold border-b-2 border-primary-gold'
                  : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              Events
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">Hardware Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-foreground/70 text-sm block mb-2">CPU</label>
                <p className="text-foreground font-medium">{endpoint.hardware.cpu}</p>
              </div>
              <div>
                <label className="text-foreground/70 text-sm block mb-2">RAM</label>
                <p className="text-foreground font-medium">{endpoint.hardware.ram}</p>
              </div>
              <div>
                <label className="text-foreground/70 text-sm block mb-2">Disk</label>
                <p className="text-foreground font-medium">{endpoint.hardware.disk}</p>
              </div>
              {endpoint.hardware.gpu && (
                <div>
                  <label className="text-foreground/70 text-sm block mb-2">GPU</label>
                  <p className="text-foreground font-medium">{endpoint.hardware.gpu}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'software' && (
          <div>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                <input
                  type="text"
                  value={softwareSearch}
                  onChange={(e) => setSoftwareSearch(e.target.value)}
                  placeholder="Search software..."
                  className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary-gold"
                />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-input border-b border-border">
                    <tr>
                      <th className="text-left px-6 py-4 text-foreground font-semibold text-sm">
                        Software Name
                      </th>
                      <th className="text-left px-6 py-4 text-foreground font-semibold text-sm">
                        Version
                      </th>
                      <th className="text-left px-6 py-4 text-foreground font-semibold text-sm">
                        Publisher
                      </th>
                      <th className="text-left px-6 py-4 text-foreground font-semibold text-sm">
                        Install Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSoftware.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-foreground/50">
                          No software found
                        </td>
                      </tr>
                    ) : (
                      filteredSoftware.map((sw) => (
                        <tr key={sw.id} className="border-b border-border hover:bg-white/5">
                          <td className="px-6 py-4 text-foreground font-medium flex items-center gap-2">
                            <Package size={16} className="text-primary-gold" />
                            {sw.name}
                          </td>
                          <td className="px-6 py-4 text-foreground/70">{sw.version}</td>
                          <td className="px-6 py-4 text-foreground/70">{sw.publisher || '-'}</td>
                          <td className="px-6 py-4 text-foreground/70">
                            {sw.installDate ? new Date(sw.installDate).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            {endpoint.events.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <Activity className="text-foreground/30 mx-auto mb-4" size={48} />
                <h3 className="text-foreground text-lg mb-2">No events</h3>
                <p className="text-foreground/60">No events recorded for this endpoint</p>
              </div>
            ) : (
              endpoint.events.map((event) => (
                <div
                  key={event.id}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary-gold/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        event.type === 'VULNERABILITY_DETECTED'
                          ? 'bg-primary-gold/10'
                          : event.type === 'SUSPICIOUS_PARENT_CHILD'
                          ? 'bg-danger/10'
                          : 'bg-foreground/10'
                      }`}>
                        <Activity className={
                          event.type === 'VULNERABILITY_DETECTED'
                            ? 'text-primary-gold'
                            : event.type === 'SUSPICIOUS_PARENT_CHILD'
                            ? 'text-danger'
                            : 'text-foreground/50'
                        } size={20} />
                      </div>
                      <div>
                        <h3 className="text-foreground font-semibold">{event.type.replace(/_/g, ' ')}</h3>
                        <div className="flex items-center gap-2 text-sm text-foreground/70 mt-1">
                          <Clock size={14} />
                          {formatDistanceToNow(event.timestamp)}
                        </div>
                      </div>
                    </div>
                    {event.severity && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.severity === 'critical'
                          ? 'bg-danger/10 text-danger border border-danger'
                          : event.severity === 'high'
                          ? 'bg-warning/10 text-warning border border-warning'
                          : 'bg-accent-gold/10 text-accent-gold border border-accent-gold'
                      }`}>
                        {event.severity.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-foreground/70">{event.details}</p>
                </div>
              ))
            )}
          </div>
        )}

        <ConfirmationModal
          isOpen={showIsolateModal}
          onClose={() => setShowIsolateModal(false)}
          onConfirm={handleIsolateEndpoint}
          title="Isolate Endpoint"
          message={`Are you sure you want to isolate '${hostname}'? This will disconnect it from the network and may prevent normal operations.`}
          confirmText="Isolate"
          cancelText="Cancel"
          type="danger"
          loading={isolating}
        />
      </main>
    </div>
  );
};
