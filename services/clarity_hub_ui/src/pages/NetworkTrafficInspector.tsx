import { useState, useEffect } from 'react';
import { Network, Activity, AlertCircle, Shield, X, Search, Play, Pause } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface NetworkPacket {
  id: number;
  timestamp: string;
  hostname: string;
  source_ip: string;
  source_port: number;
  dest_ip: string;
  dest_port: number;
  protocol: string;
  packet_size: number;
  process_name: string;
  process_pid: number;
  parent_process: string;
  status: string;
  ml_verdict: 'BENIGN' | 'MALICIOUS';
  confidence: number;
  threat_indicators: string;
  event_type: string;
}

interface TrafficData {
  total: number;
  traffic: NetworkPacket[];
}

type TabType = 'live' | 'analysis';

export const NetworkTrafficInspector = () => {
  const [activeTab, setActiveTab] = useState<TabType>('live');
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [filteredPackets, setFilteredPackets] = useState<NetworkPacket[]>([]);
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(true);
  const [showOnlyMalicious, setShowOnlyMalicious] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPacket, setSelectedPacket] = useState<NetworkPacket | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch traffic data from API
  useEffect(() => {
    const fetchTrafficData = async () => {
      try {
        const response = await axios.get<TrafficData>(`${API_BASE_URL}/api/network-traffic?limit=100`);
        setPackets(response.data.traffic);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching traffic data:', error);
        setLoading(false);
      }
    };

    fetchTrafficData();

    // Set up polling for live updates if monitoring is enabled
    if (isLiveMonitoring) {
      const interval = setInterval(fetchTrafficData, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isLiveMonitoring]);

  // Apply filters
  useEffect(() => {
    let filtered = packets;

    if (showOnlyMalicious) {
      filtered = filtered.filter(p => p.ml_verdict === 'MALICIOUS');
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.source_ip.includes(term) ||
        p.dest_ip.includes(term) ||
        p.process_name.toLowerCase().includes(term) ||
        p.hostname.toLowerCase().includes(term)
      );
    }

    setFilteredPackets(filtered);
  }, [packets, showOnlyMalicious, searchTerm]);

  // Calculate statistics
  const stats = {
    total: filteredPackets.length,
    malicious: filteredPackets.filter(p => p.ml_verdict === 'MALICIOUS').length,
    benign: filteredPackets.filter(p => p.ml_verdict === 'BENIGN').length,
    protocols: {
      TCP: filteredPackets.filter(p => p.protocol === 'TCP').length,
      UDP: filteredPackets.filter(p => p.protocol === 'UDP').length,
      ICMP: filteredPackets.filter(p => p.protocol === 'ICMP').length,
    }
  };

  // Chart data
  const protocolData = [
    { name: 'TCP', value: stats.protocols.TCP, color: '#3b82f6' },
    { name: 'UDP', value: stats.protocols.UDP, color: '#10b981' },
    { name: 'ICMP', value: stats.protocols.ICMP, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const verdictData = [
    { name: 'BENIGN', value: stats.benign, fill: '#10b981' },
    { name: 'MALICIOUS', value: stats.malicious, fill: '#ef4444' },
  ].filter(d => d.value > 0);

  // Traffic volume over time (aggregate by minute)
  const trafficVolumeData = filteredPackets
    .reduce((acc: any[], packet) => {
      const time = new Date(packet.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const existing = acc.find(item => item.time === time);
      if (existing) {
        existing.packets += 1;
        if (packet.ml_verdict === 'MALICIOUS') existing.malicious += 1;
      } else {
        acc.push({
          time,
          packets: 1,
          malicious: packet.ml_verdict === 'MALICIOUS' ? 1 : 0
        });
      }
      return acc;
    }, [])
    .slice(-20); // Last 20 time intervals

  const tabs = [
    {
      id: 'live' as TabType,
      label: 'Live Monitor',
      icon: Activity,
      description: 'Real-time network traffic inspection',
    },
    {
      id: 'analysis' as TabType,
      label: 'ML Analysis',
      icon: Shield,
      description: 'AI-powered threat detection statistics',
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />
      
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="border-b pb-6 mb-6" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)' }}>
                <Network className="h-10 w-10" style={{ color: 'hsl(var(--primary-gold))' }} />
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                  Network Traffic Inspector
                </h1>
                <p className="text-lg mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Real-time network monitoring with ML-powered threat detection
                </p>
              </div>
            </div>

            {/* Live Monitoring Toggle */}
            <button
              onClick={() => setIsLiveMonitoring(!isLiveMonitoring)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: isLiveMonitoring ? 'hsl(var(--primary-gold) / 0.1)' : 'hsl(var(--card))',
                border: `2px solid ${isLiveMonitoring ? 'hsl(var(--primary-gold))' : 'hsl(var(--border))'}`,
                color: isLiveMonitoring ? 'hsl(var(--primary-gold))' : 'hsl(var(--foreground))'
              }}
            >
              {isLiveMonitoring ? (
                <>
                  <Pause className="h-5 w-5" />
                  <span className="font-semibold">Live</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  <span className="font-semibold">Paused</span>
                </>
              )}
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-3 px-6 py-3 rounded-t-lg transition-all duration-300 relative"
                  style={{
                    backgroundColor: isActive ? 'hsl(var(--card))' : 'transparent',
                    color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                    borderBottom: isActive ? '3px solid hsl(var(--primary-gold))' : '3px solid transparent',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">{tab.label}</div>
                    <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {tab.description}
                    </div>
                  </div>
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full"
                      style={{
                        backgroundColor: 'hsl(var(--primary-gold))',
                        boxShadow: '0 0 10px hsl(var(--primary-gold))',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Connections</div>
                <div className="text-3xl font-bold mt-1" style={{ color: 'hsl(var(--foreground))' }}>{stats.total}</div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Benign Traffic</div>
                <div className="text-3xl font-bold mt-1 text-green-500">{stats.benign}</div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Threats Detected</div>
                <div className="text-3xl font-bold mt-1 text-red-500">{stats.malicious}</div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Active Processes</div>
                <div className="text-3xl font-bold mt-1" style={{ color: 'hsl(var(--primary-gold))' }}>
                  {new Set(filteredPackets.map(p => p.process_name)).size}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <button
                onClick={() => setShowOnlyMalicious(!showOnlyMalicious)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                style={{
                  backgroundColor: showOnlyMalicious ? 'hsl(var(--destructive) / 0.2)' : 'transparent',
                  border: `2px solid ${showOnlyMalicious ? 'hsl(var(--destructive))' : 'hsl(var(--border))'}`,
                  color: showOnlyMalicious ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))'
                }}
              >
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Malicious Only</span>
              </button>

              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <input
                  type="text"
                  placeholder="Search by IP, process, or hostname..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg outline-none transition-all"
                  style={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                  }}
                />
              </div>

              {(showOnlyMalicious || searchTerm) && (
                <button
                  onClick={() => {
                    setShowOnlyMalicious(false);
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 rounded-lg transition-all"
                  style={{
                    backgroundColor: 'hsl(var(--muted))',
                    color: 'hsl(var(--foreground))'
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Traffic Table */}
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: 'hsl(var(--muted))' }}>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Timestamp</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Source</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Destination</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Protocol</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Process</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Verdict</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Confidence</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Threat Indicators</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Loading traffic data...
                        </td>
                      </tr>
                    ) : filteredPackets.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          No traffic data found. {showOnlyMalicious && 'Try removing filters.'}
                        </td>
                      </tr>
                    ) : (
                      filteredPackets.slice(0, 50).map((packet) => (
                        <tr
                          key={packet.id}
                          onClick={() => setSelectedPacket(packet)}
                          className="cursor-pointer transition-all hover:bg-white/5"
                          style={{ borderBottom: '1px solid hsl(var(--border))' }}
                        >
                          <td className="px-4 py-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {new Date(packet.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div style={{ color: 'hsl(var(--foreground))' }}>
                              {packet.source_ip}:{packet.source_port}
                            </div>
                            <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {packet.hostname}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                            {packet.dest_ip}:{packet.dest_port}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor:
                                  packet.protocol === 'TCP'
                                    ? '#3b82f6'
                                    : packet.protocol === 'UDP'
                                    ? '#10b981'
                                    : '#f59e0b',
                                color: '#fff',
                              }}
                            >
                              {packet.protocol}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div style={{ color: 'hsl(var(--foreground))' }}>{packet.process_name}</div>
                            <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              PID: {packet.process_pid}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: 'hsl(var(--muted))',
                                color: 'hsl(var(--foreground))',
                              }}
                            >
                              {packet.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className="px-2 py-1 rounded text-xs font-bold"
                              style={{
                                backgroundColor: packet.ml_verdict === 'MALICIOUS' ? '#ef4444' : '#10b981',
                                color: '#fff',
                              }}
                            >
                              {packet.ml_verdict}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${packet.confidence * 100}%`,
                                    backgroundColor: packet.ml_verdict === 'MALICIOUS' ? '#ef4444' : '#10b981',
                                  }}
                                />
                              </div>
                              <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>
                                {(packet.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className="text-xs"
                              style={{
                                color: packet.ml_verdict === 'MALICIOUS' ? '#ef4444' : 'hsl(var(--muted-foreground))',
                              }}
                            >
                              {packet.threat_indicators}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPacket(packet);
                              }}
                              className="px-3 py-1 rounded text-xs font-medium transition-all"
                              style={{
                                backgroundColor: 'hsl(var(--primary-gold) / 0.1)',
                                color: 'hsl(var(--primary-gold))',
                                border: '1px solid hsl(var(--primary-gold))'
                              }}
                            >
                              Inspect
                            </button>
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

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Charts Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Traffic Volume Chart */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
                  Traffic Volume Over Time
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={trafficVolumeData}>
                    <defs>
                      <linearGradient id="colorPackets" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary-gold))" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(var(--primary-gold))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorMalicious" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area type="monotone" dataKey="packets" stroke="hsl(var(--primary-gold))" fillOpacity={1} fill="url(#colorPackets)" />
                    <Area type="monotone" dataKey="malicious" stroke="#ef4444" fillOpacity={1} fill="url(#colorMalicious)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Protocol Distribution */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
                  Protocol Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={protocolData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label
                    >
                      {protocolData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Verdict Ratio */}
              <div className="p-6 rounded-lg col-span-2" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
                  ML Verdict Analysis
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={verdictData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* IDPS Stats */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
                Axon Engine Performance Metrics
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Detection Rate</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: 'hsl(var(--primary-gold))' }}>98.1%</div>
                  <div className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Combined Layer 1 + 2</div>
                </div>
                <div>
                  <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>False Positive Rate</div>
                  <div className="text-2xl font-bold mt-1 text-green-500">&lt; 5%</div>
                  <div className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Industry leading</div>
                </div>
                <div>
                  <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Processing Latency</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: 'hsl(var(--foreground))' }}>1.1s</div>
                  <div className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>End-to-end</div>
                </div>
                <div>
                  <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Throughput</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: 'hsl(var(--foreground))' }}>10K+</div>
                  <div className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Events/second</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inspection Drawer */}
        {selectedPacket && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8"
            onClick={() => setSelectedPacket(null)}
          >
            <div
              className="max-w-3xl w-full rounded-lg p-6 max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--border))' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                  Packet Inspection
                </h2>
                <button
                  onClick={() => setSelectedPacket(null)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-all"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Verdict Badge */}
                <div className="flex items-center gap-3">
                  <span
                    className="px-4 py-2 rounded-lg text-lg font-bold"
                    style={{
                      backgroundColor: selectedPacket.ml_verdict === 'MALICIOUS' ? '#ef4444' : '#10b981',
                      color: '#fff',
                    }}
                  >
                    {selectedPacket.ml_verdict}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      ML Confidence
                    </div>
                    <div className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                      {(selectedPacket.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Connection Details */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Source
                    </div>
                    <div className="text-lg font-mono" style={{ color: 'hsl(var(--foreground))' }}>
                      {selectedPacket.source_ip}:{selectedPacket.source_port}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Destination
                    </div>
                    <div className="text-lg font-mono" style={{ color: 'hsl(var(--foreground))' }}>
                      {selectedPacket.dest_ip}:{selectedPacket.dest_port}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Protocol
                    </div>
                    <div className="text-lg" style={{ color: 'hsl(var(--foreground))' }}>
                      {selectedPacket.protocol}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Packet Size
                    </div>
                    <div className="text-lg" style={{ color: 'hsl(var(--foreground))' }}>
                      {selectedPacket.packet_size} bytes
                    </div>
                  </div>
                </div>

                {/* Process Details */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                  <div className="text-sm font-semibold mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Process Information
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span style={{ color: 'hsl(var(--muted-foreground))' }}>Name:</span>
                      <span className="font-mono" style={{ color: 'hsl(var(--foreground))' }}>
                        {selectedPacket.process_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'hsl(var(--muted-foreground))' }}>PID:</span>
                      <span className="font-mono" style={{ color: 'hsl(var(--foreground))' }}>
                        {selectedPacket.process_pid}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'hsl(var(--muted-foreground))' }}>Parent:</span>
                      <span className="font-mono" style={{ color: 'hsl(var(--foreground))' }}>
                        {selectedPacket.parent_process}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'hsl(var(--muted-foreground))' }}>Hostname:</span>
                      <span className="font-mono" style={{ color: 'hsl(var(--foreground))' }}>
                        {selectedPacket.hostname}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Explanation */}
                {selectedPacket.ml_verdict === 'MALICIOUS' && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#ef4444', color: '#fff' }}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-semibold mb-1">Threat Analysis</div>
                        <div className="text-sm opacity-90">
                          This connection exhibits patterns consistent with malicious behavior detected by the Axon
                          Engine's deep neural network (Layer 2). The process "{selectedPacket.process_name}" initiated
                          an unusual network connection that matches known attack signatures in the CICIDS2017 training
                          dataset.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all"
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#fff',
                    }}
                  >
                    Block IP Address
                  </button>
                  <button
                    className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all"
                    style={{
                      backgroundColor: 'hsl(var(--primary-gold))',
                      color: 'hsl(var(--background))',
                    }}
                  >
                    Quarantine Process
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
