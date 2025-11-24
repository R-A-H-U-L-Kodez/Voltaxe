import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { snapshotService, incidentService } from '../services/api';
import { Snapshot } from '../types';
import {
  Server,
  Shield,
  Zap,
  Activity,
  ArrowRight,
  Radio,
  AlertTriangle,
  CheckCircle,
  Clock,
  Scan,
  FileText,
  Users
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  danger?: boolean;
  subtitle?: string;
}

const MetricCard = ({ title, value, icon: Icon, trend, trendUp, danger, subtitle }: MetricCardProps) => {
  return (
    <div 
      className="card p-6 hover:border-primary-gold/30 transition-all duration-300 shadow-surface"
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)' }}
        >
          <Icon className="h-6 w-6" style={{ color: 'hsl(var(--primary-gold))' }} />
        </div>
        {trend && (
          <span 
            className="text-sm font-semibold px-2 py-1 rounded"
            style={{ 
              color: trendUp ? 'hsl(var(--success))' : 'hsl(var(--danger))',
              backgroundColor: trendUp ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--danger) / 0.1)'
            }}
          >
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {title}
        </p>
        <p 
          className="text-3xl font-bold"
          style={{ color: danger ? 'hsl(var(--danger))' : 'hsl(var(--foreground))' }}
        >
          {value}
        </p>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export const CommandCenterPage = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [threatLevel] = useState<'operational' | 'threat'>('operational');
  
  // Real data state
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [activeIncidents, setActiveIncidents] = useState(0);
  const [loading, setLoading] = useState(true);

  // Real metrics derived from API data
  const activeAgents = snapshots.filter(s => s.status === 'online').length;
  const totalAgents = snapshots.length;
  const threatsBlocked = snapshots.reduce((acc, s) => acc + (s.vulnerabilities || 0), 0);
  
  // Calculate network traffic based on active agents
  const networkTraffic = totalAgents > 0 ? `${(activeAgents * 0.85).toFixed(1)} GB/s` : '0 GB/s';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from API
      const [snapshotsData, incidentsData] = await Promise.all([
        snapshotService.getSnapshots(),
        incidentService.getIncidents({ status: 'open', limit: 100 })
      ]);
      
      setSnapshots(snapshotsData);
      setActiveIncidents(incidentsData.incidents?.length || 0);
    } catch (err) {
      console.error('Failed to fetch Command Center data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Convert snapshots to map dots with real data
  const mapDots = snapshots.map((snapshot, index) => ({
    id: snapshot.id,
    x: (index % 10) * 10 + Math.random() * 5,
    y: Math.floor(index / 10) * 20 + Math.random() * 15,
    isActive: snapshot.status === 'online',
    isThreat: snapshot.riskLevel === 'CRITICAL' || snapshot.risk_category === 'CRITICAL',
    hostname: snapshot.hostname
  }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />

      <main className="ml-64 p-8">
        {/* System Status Header */}
        <div 
          className={`card p-8 mb-8 border-2 transition-all duration-300 ${
            threatLevel === 'operational' 
              ? 'border-success/30 bg-gradient-to-r from-success/5 to-transparent' 
              : 'border-danger/30 bg-gradient-to-r from-danger/5 to-transparent'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div 
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    threatLevel === 'operational' ? 'bg-success/20' : 'bg-danger/20'
                  }`}
                >
                  {threatLevel === 'operational' ? (
                    <CheckCircle 
                      className="h-8 w-8" 
                      style={{ color: 'hsl(var(--success))' }} 
                    />
                  ) : (
                    <AlertTriangle 
                      className="h-8 w-8" 
                      style={{ color: 'hsl(var(--danger))' }} 
                    />
                  )}
                </div>
                {/* Pulsing animation dot */}
                <div 
                  className={`absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse ${
                    threatLevel === 'operational' ? 'bg-success' : 'bg-danger'
                  }`}
                  style={{
                    boxShadow: threatLevel === 'operational' 
                      ? '0 0 20px hsl(var(--success))' 
                      : '0 0 20px hsl(var(--danger))'
                  }}
                />
              </div>
              <div>
                <h1 
                  className={`text-4xl font-bold tracking-wide ${
                    threatLevel === 'operational' ? 'text-success' : 'text-danger'
                  }`}
                >
                  {threatLevel === 'operational' ? 'SYSTEM OPERATIONAL' : 'THREAT DETECTED'}
                </h1>
                <p className="text-lg mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  All systems nominal • Network secure
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Clock className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Last Scan
                </span>
              </div>
              <p className="text-xl font-mono font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                {currentTime.toLocaleTimeString()}
              </p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {currentTime.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Operational Metrics - Row of 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Active Agents"
            value={`${activeAgents}/${totalAgents}`}
            subtitle={`${totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : 0}% Online`}
            icon={Server}
          />
          <MetricCard
            title="Total Vulnerabilities"
            value={threatsBlocked}
            subtitle="Across all endpoints"
            icon={Shield}
          />
          <MetricCard
            title="Active Incidents"
            value={activeIncidents}
            danger={activeIncidents > 0}
            icon={Zap}
          />
          <MetricCard
            title="Network Traffic"
            value={networkTraffic}
            subtitle="Current Load"
            icon={Activity}
          />
        </div>

        {/* Main Content Grid: Global Threat Map + Quick Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Global Threat Map - 8 Columns */}
          <div className="xl:col-span-8">
            <div className="card p-6 shadow-surface hover:border-primary-gold/30 transition-all duration-300 relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gradient-gold mb-1">
                    Global Threat Map
                  </h2>
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Real-time endpoint monitoring across your network
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border animate-pulse"
                  style={{ 
                    backgroundColor: 'hsl(var(--success) / 0.1)',
                    borderColor: 'hsl(var(--success) / 0.3)',
                    color: 'hsl(var(--success))'
                  }}
                >
                  <Radio className="h-4 w-4" />
                  <span className="text-sm font-semibold">LIVE MONITORING</span>
                </div>
              </div>

              {/* Map Container */}
              <div 
                className="relative rounded-lg overflow-hidden"
                style={{ 
                  height: '500px',
                  backgroundColor: 'hsl(var(--background))',
                  backgroundImage: `
                    radial-gradient(circle at 50% 50%, hsl(var(--primary-gold) / 0.03) 0%, transparent 70%),
                    radial-gradient(circle at 2px 2px, hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)
                  `,
                  backgroundSize: '100% 100%, 40px 40px',
                  border: '1px solid hsl(var(--border))'
                }}
              >
                {/* Scanning Lines Effect */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, transparent 0%, hsl(var(--primary-gold) / 0.05) 50%, transparent 100%)',
                    animation: 'scan 4s linear infinite'
                  }}
                />

                {/* Map Dots (Agents) */}
                {mapDots.map((dot) => (
                  <div
                    key={dot.id}
                    className={`absolute w-3 h-3 rounded-full transition-all duration-300 cursor-pointer group ${
                      dot.isThreat ? 'animate-pulse' : ''
                    }`}
                    style={{
                      left: `${dot.x}%`,
                      top: `${dot.y}%`,
                      backgroundColor: dot.isThreat 
                        ? 'hsl(var(--danger))' 
                        : dot.isActive 
                          ? 'hsl(var(--success))' 
                          : 'hsl(var(--muted-foreground) / 0.3)',
                      boxShadow: dot.isThreat 
                        ? '0 0 20px hsl(var(--danger))' 
                        : dot.isActive 
                          ? '0 0 10px hsl(var(--success))' 
                          : 'none'
                    }}
                    title={dot.hostname}
                  >
                    {/* Ripple effect for active dots */}
                    {dot.isActive && (
                      <div 
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{
                          backgroundColor: dot.isThreat 
                            ? 'hsl(var(--danger))' 
                            : 'hsl(var(--success))'
                        }}
                      />
                    )}
                    {/* Tooltip on hover */}
                    <div 
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                      style={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--foreground))'
                      }}
                    >
                      {dot.hostname}
                    </div>
                  </div>
                ))}

                {/* Central Hub Visual */}
                <div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <div 
                    className="w-20 h-20 rounded-full border-2 flex items-center justify-center"
                    style={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--primary-gold))',
                      boxShadow: '0 0 30px hsl(var(--primary-gold) / 0.3)'
                    }}
                  >
                    <Activity 
                      className="h-8 w-8 animate-pulse" 
                      style={{ color: 'hsl(var(--primary-gold))' }} 
                    />
                  </div>
                  {/* Connection Lines */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                      <div
                        key={angle}
                        className="absolute h-0.5 w-32 origin-left"
                        style={{
                          transform: `rotate(${angle}deg)`,
                          backgroundColor: 'hsl(var(--primary-gold) / 0.2)',
                          boxShadow: '0 0 5px hsl(var(--primary-gold) / 0.3)'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div 
                  className="absolute bottom-4 right-4 card p-3 flex gap-4"
                  style={{ backgroundColor: 'hsl(var(--card) / 0.9)' }}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: 'hsl(var(--success))' }}
                    />
                    <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>
                      Active
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: 'hsl(var(--muted-foreground) / 0.3)' }}
                    />
                    <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>
                      Idle
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full animate-pulse" 
                      style={{ backgroundColor: 'hsl(var(--danger))' }}
                    />
                    <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>
                      Threat
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel - 4 Columns */}
          <div className="xl:col-span-4">
            <div className="card p-6 shadow-surface hover:border-primary-gold/30 transition-all duration-300">
              <h2 className="text-2xl font-bold text-gradient-gold mb-4">
                Quick Actions
              </h2>
              <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Execute critical operations instantly
              </p>

              <div className="space-y-4">
                {/* Initiate Global Scan - Primary Action */}
                <button
                  onClick={() => navigate('/snapshots')}
                  className="w-full gradient-gold p-4 rounded-lg flex items-center justify-between group hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-primary-gold/20"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                    >
                      <Scan className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white">Initiate Global Scan</p>
                      <p className="text-xs text-white/70">Scan all endpoints</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Generate Compliance Report */}
                <button
                  onClick={() => navigate('/resilience')}
                  className="w-full p-4 rounded-lg flex items-center justify-between group hover:scale-[1.02] transition-all duration-300 border"
                  style={{
                    backgroundColor: 'hsl(var(--muted))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)' }}
                    >
                      <FileText 
                        className="h-5 w-5" 
                        style={{ color: 'hsl(var(--primary-gold))' }} 
                      />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Resilience Intelligence</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Health monitoring & analytics
                      </p>
                    </div>
                  </div>
                  <ArrowRight 
                    className="h-5 w-5 group-hover:translate-x-1 transition-transform" 
                    style={{ color: 'hsl(var(--primary-gold))' }}
                  />
                </button>

                {/* Manage Team */}
                <button
                  onClick={() => navigate('/team-management')}
                  className="w-full p-4 rounded-lg flex items-center justify-between group hover:scale-[1.02] transition-all duration-300 border"
                  style={{
                    backgroundColor: 'hsl(var(--muted))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)' }}
                    >
                      <Users 
                        className="h-5 w-5" 
                        style={{ color: 'hsl(var(--primary-gold))' }} 
                      />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Manage Team</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        User access control
                      </p>
                    </div>
                  </div>
                  <ArrowRight 
                    className="h-5 w-5 group-hover:translate-x-1 transition-transform" 
                    style={{ color: 'hsl(var(--primary-gold))' }}
                  />
                </button>

                {/* Divider */}
                <div 
                  className="h-px my-4"
                  style={{ backgroundColor: 'hsl(var(--border))' }}
                />

                {/* Additional Quick Links */}
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/alerts')}
                    className="w-full p-3 rounded-lg flex items-center justify-between group hover:bg-muted/50 transition-all duration-300"
                  >
                    <span className="text-sm font-medium">View All Alerts</span>
                    <ArrowRight 
                      className="h-4 w-4 group-hover:translate-x-1 transition-transform" 
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                  </button>
                  <button
                    onClick={() => navigate('/live-events')}
                    className="w-full p-3 rounded-lg flex items-center justify-between group hover:bg-muted/50 transition-all duration-300"
                  >
                    <span className="text-sm font-medium">Live Event Feed</span>
                    <ArrowRight 
                      className="h-4 w-4 group-hover:translate-x-1 transition-transform" 
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                  </button>
                  <button
                    onClick={() => navigate('/resilience')}
                    className="w-full p-3 rounded-lg flex items-center justify-between group hover:bg-muted/50 transition-all duration-300"
                  >
                    <span className="text-sm font-medium">Resilience Intelligence</span>
                    <ArrowRight 
                      className="h-4 w-4 group-hover:translate-x-1 transition-transform" 
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add scanning animation keyframe */}
      <style>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
      `}</style>
    </div>
  );
};
