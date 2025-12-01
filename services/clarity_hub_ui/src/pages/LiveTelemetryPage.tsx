import { useState, useEffect } from 'react';
import { Activity, Database, TrendingUp, Clock, CheckCircle, AlertCircle, RefreshCw, AlertTriangle, Play, Pause, Zap, Server } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { axonService } from '../services/api';

interface TelemetryData {
  total_records: number;
  unique_snapshots: number;
  unique_processes: number;
  unique_hosts: number;
  oldest_snapshot: string;
  newest_snapshot: string;
  hours_collected: number;
  training_ready: boolean;
  hours_remaining: number;
  estimated_ready: string;
  collection_rate: number;
  recent_snapshots: Array<{
    hostname: string;
    timestamp: string;
    process_count: number;
  }>;
}

type TabType = 'overview' | 'training';

export default function LiveTelemetryPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showRetrainDialog, setShowRetrainDialog] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    try {
      const response = await fetch('/api/ml/telemetry');
      if (!response.ok) throw new Error('Failed to fetch telemetry data');
      const data = await response.json();
      setTelemetry(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainSuccess(null);
    setError(null);
    
    try {
      const result = await axonService.retrainModel();
      setRetrainSuccess(result.message);
      setShowRetrainDialog(false);
      
      // Show success message for 5 seconds
      setTimeout(() => {
        setRetrainSuccess(null);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger retraining');
    } finally {
      setRetraining(false);
    }
  };

  useEffect(() => {
    if (isLiveMonitoring) {
      fetchTelemetry();
      const interval = setInterval(fetchTelemetry, 5000);
      return () => clearInterval(interval);
    }
  }, [isLiveMonitoring]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">Error: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!telemetry) return null;

  const progressPercentage = (telemetry.hours_collected / 48) * 100;

  // Chart data
  const collectionData = telemetry.recent_snapshots.slice(-10).map(s => ({
    time: new Date(s.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    processes: s.process_count,
    hostname: s.hostname
  }));

  const hostnameData = [
    { name: 'Unique Hosts', value: telemetry.unique_hosts, fill: '#3b82f6' },
    { name: 'Snapshots', value: telemetry.unique_snapshots, fill: '#10b981' },
  ];

  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Overview',
      icon: Activity,
      description: 'Real-time data collection monitoring',
    },
    {
      id: 'training' as TabType,
      label: 'ML Training',
      icon: Zap,
      description: 'Model training status and controls',
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
                <Activity className="h-10 w-10" style={{ color: 'hsl(var(--primary-gold))' }} />
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                  Live Telemetry
                </h1>
                <p className="text-lg mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Real-time ML data collection monitoring with AI-powered insights
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
                  <span className="font-medium">Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  <span className="font-medium">Resume</span>
                </>
              )}
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: activeTab === tab.id ? 'hsl(var(--card))' : 'transparent',
                    border: `2px solid ${activeTab === tab.id ? 'hsl(var(--primary-gold))' : 'hsl(var(--border))'}`,
                    color: activeTab === tab.id ? 'hsl(var(--primary-gold))' : 'hsl(var(--foreground))'
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">{tab.label}</div>
                    <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          </div>

        {/* Success Message */}
        {retrainSuccess && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#10b981', color: 'white' }}>
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 mr-3" />
              <div>
                <h3 className="font-semibold">Retraining Initiated</h3>
                <p>{retrainSuccess}</p>
              </div>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--border))' }}>
                <div className="flex items-center justify-between mb-2">
                  <Database className="h-8 w-8" style={{ color: 'hsl(var(--primary-gold))' }} />
                  <span className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                    {telemetry.total_records.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Total Records
                </div>
                <div className="mt-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {telemetry.unique_snapshots} snapshots collected
                </div>
              </div>

              <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--border))' }}>
                <div className="flex items-center justify-between mb-2">
                  <Server className="h-8 w-8" style={{ color: '#10b981' }} />
                  <span className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                    {telemetry.unique_processes.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Unique Processes
                </div>
                <div className="mt-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Across {telemetry.unique_hosts} hosts
                </div>
              </div>

              <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--border))' }}>
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-8 w-8" style={{ color: '#f59e0b' }} />
                  <span className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                    {telemetry.hours_collected.toFixed(1)}h
                  </span>
                </div>
                <div className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Data Collected
                </div>
                <div className="mt-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {telemetry.hours_remaining.toFixed(1)}h until training ready
                </div>
              </div>

              <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--border))' }}>
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-8 w-8" style={{ color: '#3b82f6' }} />
                  <span className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                    {telemetry.collection_rate.toFixed(1)}/min
                  </span>
                </div>
                <div className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Collection Rate
                </div>
                <div className="mt-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Collection Timeline */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--border))' }}>
                <h3 className="text-xl font-bold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
                  Recent Collection Activity
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={collectionData}>
                    <defs>
                      <linearGradient id="processGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary-gold))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary-gold))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area type="monotone" dataKey="processes" stroke="hsl(var(--primary-gold))" fillOpacity={1} fill="url(#processGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Host Distribution */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--border))' }}>
                <h3 className="text-xl font-bold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
                  Data Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={hostnameData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {hostnameData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Snapshots Table */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--border))' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
                Recent Snapshots
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '2px solid hsl(var(--border))' }}>
                      <th className="text-left p-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Hostname</th>
                      <th className="text-left p-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Timestamp</th>
                      <th className="text-right p-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Processes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telemetry.recent_snapshots.slice(-5).reverse().map((snapshot, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <td className="p-3 font-medium" style={{ color: 'hsl(var(--foreground))' }}>{snapshot.hostname}</td>
                        <td className="p-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {new Date(snapshot.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-semibold" style={{ color: 'hsl(var(--primary-gold))' }}>
                          {snapshot.process_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Training Tab */}
        {activeTab === 'training' && (
          <>
            {/* Training Status Banner */}
            <div
              className="mb-6 p-6 rounded-lg"
              style={{
                backgroundColor: telemetry.training_ready ? '#10b981' : 'hsl(var(--card))',
                border: `2px solid ${telemetry.training_ready ? '#10b981' : 'hsl(var(--primary-gold))'}`,
                color: telemetry.training_ready ? 'white' : 'hsl(var(--foreground))'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {telemetry.training_ready ? (
                    <CheckCircle className="h-10 w-10 mr-4" />
                  ) : (
                    <Clock className="h-10 w-10 mr-4 animate-pulse" style={{ color: 'hsl(var(--primary-gold))' }} />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">
                      {telemetry.training_ready
                        ? '✅ Ready for Training!'
                        : '⏳ Data Collection in Progress'}
                    </h2>
                    <p className="mt-1" style={{ opacity: telemetry.training_ready ? 1 : 0.8 }}>
                      {telemetry.training_ready
                        ? 'You can now train the Isolation Forest model'
                        : `${telemetry.hours_remaining.toFixed(1)} hours remaining until training ready`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRetrainDialog(true)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-lg flex items-center"
                >
                  <RefreshCw className={`h-5 w-5 mr-2 ${retraining ? 'animate-spin' : ''}`} />
                  🚨 Retrain Model
                </button>
              </div>

              {/* Progress Bar */}
              {!telemetry.training_ready && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2" style={{ opacity: 0.8 }}>
                    <span>{telemetry.hours_collected.toFixed(1)} hours collected</span>
                    <span>48 hours required</span>
                  </div>
                  <div className="w-full rounded-full h-3" style={{ backgroundColor: 'hsl(var(--border))' }}>
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(progressPercentage, 100)}%`,
                        backgroundColor: 'hsl(var(--primary-gold))'
                      }}
                    ></div>
                  </div>
                  <div className="text-sm mt-2 text-center" style={{ opacity: 0.8 }}>
                    {progressPercentage.toFixed(1)}% complete • Est. ready:{' '}
                    {new Date(telemetry.estimated_ready).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Training Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--border))' }}>
                <h3 className="text-xl font-bold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
                  When to Retrain
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5" style={{ color: '#10b981' }} />
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                      You installed new legitimate software (e.g., Obsidian.exe)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5" style={{ color: '#10b981' }} />
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                      False positive rate is too high
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5" style={{ color: '#10b981' }} />
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Need to incorporate recent data immediately
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--border))' }}>
                <h3 className="text-xl font-bold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
                  Training Details
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" style={{ color: '#f59e0b' }} />
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Training will take 1-3 minutes
                    </span>
                  </li>
                  <li className="flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" style={{ color: '#f59e0b' }} />
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Model will update automatically when complete
                    </span>
                  </li>
                  <li className="flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" style={{ color: '#f59e0b' }} />
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                      No service interruption during training
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* Retrain Confirmation Dialog */}
        {showRetrainDialog && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => !retraining && setShowRetrainDialog(false)}
          >
            <div 
              className="p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
              style={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--border))' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-8 w-8 mr-3" style={{ color: '#f59e0b' }} />
                <h3 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                  🚨 Panic Button
                </h3>
              </div>
              
              <p className="mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                This will trigger an immediate ML model retraining using all available data.
              </p>

              <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)', border: '1px solid hsl(var(--primary-gold))' }}>
                <p className="font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>Use this when:</p>
                <ul className="space-y-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <li>• You installed new software being flagged</li>
                  <li>• False positives are too high</li>
                  <li>• Recent data needs immediate incorporation</li>
                </ul>
              </div>

              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: 'hsl(var(--foreground))' }}>
                <p className="font-semibold mb-2">Important:</p>
                <ul className="space-y-1 text-sm">
                  <li>• Training will take 1-3 minutes</li>
                  <li>• Model updates automatically when complete</li>
                  <li>• No service interruption</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowRetrainDialog(false)}
                  disabled={retraining}
                  className="px-4 py-2 rounded-lg transition-all"
                  style={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '2px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRetrain}
                  disabled={retraining}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all flex items-center"
                >
                  {retraining ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Retraining...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Retrain Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
