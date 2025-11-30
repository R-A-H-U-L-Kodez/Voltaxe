import { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Network, Zap, TrendingUp, Database, Clock } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface SystemMetrics {
  timestamp: string;
  cpu_percent: number;
  memory_percent: number;
  disk_io_read_mb: number;
  disk_io_write_mb: number;
  network_bytes_sent_mb: number;
  network_bytes_recv_mb: number;
  process_count: number;
  thread_count: number;
  disk_usage_percent: number;
}

interface AxonMetrics {
  detection_rate: number;
  events_processed: number;
  avg_response_time_ms: number;
  threats_blocked: number;
  active_connections: number;
  ml_models_active: number;
}

interface PerformanceData {
  system: SystemMetrics;
  axon: AxonMetrics;
}

export const AxonEngineMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceData | null>(null);
  const [historicalData, setHistoricalData] = useState<SystemMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(true);

  // Fetch real-time metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get<PerformanceData>(`${API_BASE_URL}/api/axon/metrics`);
        setMetrics(response.data);
        
        // Add to historical data
        setHistoricalData(prev => {
          const newData = [...prev, response.data.system];
          return newData.slice(-20); // Keep last 20 data points
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setLoading(false);
      }
    };

    fetchMetrics();

    // Set up polling for live updates
    if (isLiveMonitoring) {
      const interval = setInterval(fetchMetrics, 2000); // Update every 2 seconds
      return () => clearInterval(interval);
    }
  }, [isLiveMonitoring]);

  if (loading || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="text-center">
          <Activity className="h-16 w-16 animate-spin mx-auto mb-4" style={{ color: 'hsl(var(--primary-gold))' }} />
          <p style={{ color: 'hsl(var(--foreground))' }}>Loading Axon Engine Metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />
      
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="border-b pb-6 mb-6" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)' }}>
                <Zap className="h-10 w-10" style={{ color: 'hsl(var(--primary-gold))' }} />
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                  Axon Engine Performance Metrics
                </h1>
                <p className="text-lg mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Real-time system performance and threat detection analytics
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
                  <Activity className="h-5 w-5 animate-pulse" />
                  <span className="font-semibold">Live</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Paused</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Axon Engine Stats */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
            Axon Engine Status
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Detection Rate</div>
                  <div className="text-3xl font-bold text-green-500">{metrics.axon.detection_rate.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8" style={{ color: 'hsl(var(--primary-gold))' }} />
                <div>
                  <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Events Processed</div>
                  <div className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                    {metrics.axon.events_processed.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Avg Response Time</div>
                  <div className="text-3xl font-bold text-blue-500">{metrics.axon.avg_response_time_ms.toFixed(1)}ms</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Performance Metrics */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
            System Performance
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex items-center gap-3 mb-2">
                <Cpu className="h-6 w-6" style={{ color: 'hsl(var(--primary-gold))' }} />
                <div className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>CPU Usage</div>
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                {metrics.system.cpu_percent.toFixed(1)}%
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${metrics.system.cpu_percent}%`,
                    backgroundColor: metrics.system.cpu_percent > 80 ? '#ef4444' : metrics.system.cpu_percent > 50 ? '#f59e0b' : '#10b981'
                  }}
                />
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex items-center gap-3 mb-2">
                <Database className="h-6 w-6 text-blue-500" />
                <div className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Memory Usage</div>
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                {metrics.system.memory_percent.toFixed(1)}%
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${metrics.system.memory_percent}%`,
                    backgroundColor: metrics.system.memory_percent > 80 ? '#ef4444' : metrics.system.memory_percent > 50 ? '#f59e0b' : '#10b981'
                  }}
                />
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex items-center gap-3 mb-2">
                <HardDrive className="h-6 w-6 text-purple-500" />
                <div className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Disk Usage</div>
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                {metrics.system.disk_usage_percent.toFixed(1)}%
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${metrics.system.disk_usage_percent}%`,
                    backgroundColor: metrics.system.disk_usage_percent > 80 ? '#ef4444' : metrics.system.disk_usage_percent > 50 ? '#f59e0b' : '#10b981'
                  }}
                />
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex items-center gap-3 mb-2">
                <Activity className="h-6 w-6 text-green-500" />
                <div className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Processes</div>
              </div>
              <div className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                {metrics.system.process_count}
              </div>
              <div className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {metrics.system.thread_count} threads
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Charts */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* CPU & Memory Over Time */}
          <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
              CPU & Memory Usage (Real-time)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="cpu_percent" 
                  stroke="#f59e0b" 
                  fill="#f59e0b" 
                  fillOpacity={0.3}
                  name="CPU %"
                />
                <Area 
                  type="monotone" 
                  dataKey="memory_percent" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  name="Memory %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Network I/O */}
          <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
              Network I/O (Real-time)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="network_bytes_sent_mb" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Sent (MB)"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="network_bytes_recv_mb" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Received (MB)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disk I/O */}
        <div className="p-6 rounded-lg mb-6" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
            Disk I/O Activity (Real-time)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={historicalData.slice(-10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="timestamp" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="disk_io_read_mb" fill="#8b5cf6" name="Read (MB)" />
              <Bar dataKey="disk_io_write_mb" fill="#ec4899" name="Write (MB)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Threat Detection Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <div className="flex items-center gap-3 mb-2">
              <Network className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Threats Blocked</div>
                <div className="text-3xl font-bold text-red-500">{metrics.axon.threats_blocked}</div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Active Connections</div>
                <div className="text-3xl font-bold text-blue-500">{metrics.axon.active_connections}</div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-8 w-8" style={{ color: 'hsl(var(--primary-gold))' }} />
              <div>
                <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>ML Models Active</div>
                <div className="text-3xl font-bold" style={{ color: 'hsl(var(--primary-gold))' }}>
                  {metrics.axon.ml_models_active}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AxonEngineMetrics;
