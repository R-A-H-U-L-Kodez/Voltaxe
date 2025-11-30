import { useState, useEffect, useMemo } from 'react';
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
  Users,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Target
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
  
  // War Room controls
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showOnlyThreats, setShowOnlyThreats] = useState(false);
  const [hoveredDot, setHoveredDot] = useState<string | null>(null);
  
  // Pan/Drag controls
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Attack arcs for visualization
  const [attackArcs, setAttackArcs] = useState<Array<{
    id: string;
    targetX: number;
    targetY: number;
    sourceX: number;
    sourceY: number;
    timestamp: number;
  }>>([]);

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
      // Fetch real data from API
      const [snapshotsData, incidentsData] = await Promise.all([
        snapshotService.getSnapshots(),
        incidentService.getIncidents({ status: 'open', limit: 100 })
      ]);
      
      setSnapshots(snapshotsData);
      setActiveIncidents(incidentsData.incidents?.length || 0);
    } catch (err) {
      console.error('Failed to fetch Command Center data:', err);
    }
  };

  // Convert snapshots to map dots with stable positioning using useMemo
  const mapDots = useMemo(() => {
    return snapshots
      .filter(snapshot => !showOnlyThreats || snapshot.riskLevel === 'CRITICAL' || snapshot.risk_category === 'CRITICAL')
      .map((snapshot, index) => {
        // Use snapshot ID as seed for consistent jitter
        const seed = snapshot.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const pseudoRandom = (seed * 9301 + 49297) % 233280 / 233280;
        
        // Add stable jitter for clustering effect
        const baseX = (index % 10) * 10;
        const baseY = Math.floor(index / 10) * 20;
        const jitterX = (pseudoRandom - 0.5) * 8; // ±4% jitter
        const jitterY = ((seed * 7919 + 1013) % 233280 / 233280 - 0.5) * 8;
        
        const riskLevel = (snapshot.riskLevel || snapshot.risk_category || 'LOW').toUpperCase();
        
        return {
          id: snapshot.id,
          x: Math.max(5, Math.min(95, baseX + jitterX)),
          y: Math.max(5, Math.min(95, baseY + jitterY)),
          isActive: snapshot.status === 'online',
          isThreat: snapshot.riskLevel === 'CRITICAL' || snapshot.risk_category === 'CRITICAL',
          isOffline: !snapshot.status || snapshot.status === 'offline',
          hostname: snapshot.hostname,
          ipAddress: snapshot.ipAddress || 'N/A',
          riskLevel: riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
          vulnerabilities: typeof snapshot.vulnerabilities === 'number' ? snapshot.vulnerabilities : 0,
          snapshot: snapshot
        };
      });
  }, [snapshots, showOnlyThreats]); // Only recalculate when snapshots or filter changes

  // Generate attack arcs for threats
  useEffect(() => {
    if (mapDots.some(d => d.isThreat)) {
      const interval = setInterval(() => {
        const threatDots = mapDots.filter(d => d.isThreat);
        if (threatDots.length > 0) {
          const randomThreat = threatDots[Math.floor(Math.random() * threatDots.length)];
          const newArc = {
            id: `arc-${Date.now()}`,
            targetX: randomThreat.x,
            targetY: randomThreat.y,
            sourceX: Math.random() * 100,
            sourceY: Math.random() * 100,
            timestamp: Date.now()
          };
          setAttackArcs(prev => [...prev, newArc]);
          
          // Remove arc after animation completes
          setTimeout(() => {
            setAttackArcs(prev => prev.filter(arc => arc.id !== newArc.id));
          }, 2000);
        }
      }, 3000); // New attack every 3 seconds
      
      return () => clearInterval(interval);
    }
  }, [mapDots]);

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
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gradient-gold mb-1">
                    WAR ROOM - Tactical Operations Center
                  </h2>
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Real-time threat intelligence and network visualization
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
                  <span className="text-sm font-semibold">LIVE FEED</span>
                </div>
              </div>

              {/* War Room Controls */}
              <div className="flex items-center gap-3 mb-4">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 card px-2 py-1">
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.6))}
                    className="p-1.5 hover:bg-primary-gold/10 rounded transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" style={{ color: '#F2C744' }} />
                  </button>
                  <span className="text-xs font-mono px-2" style={{ color: '#F2C744' }}>
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2))}
                    className="p-1.5 hover:bg-primary-gold/10 rounded transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" style={{ color: '#F2C744' }} />
                  </button>
                  <button
                    onClick={() => {
                      setZoomLevel(1);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    className="p-1.5 ml-1 hover:bg-primary-gold/10 rounded transition-colors border-l"
                    style={{ borderColor: '#333' }}
                    title="Reset View"
                  >
                    <Target className="h-4 w-4" style={{ color: '#F2C744' }} />
                  </button>
                </div>

                {/* Threat Filter Toggle */}
                <button
                  onClick={() => setShowOnlyThreats(!showOnlyThreats)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded card transition-all ${
                    showOnlyThreats ? 'border-2' : ''
                  }`}
                  style={showOnlyThreats ? {
                    borderColor: 'hsl(var(--danger))',
                    backgroundColor: 'hsl(var(--danger) / 0.1)'
                  } : {}}
                  title={showOnlyThreats ? "Show All Endpoints" : "Show Only Threats"}
                >
                  {showOnlyThreats ? (
                    <Eye className="h-4 w-4" style={{ color: 'hsl(var(--danger))' }} />
                  ) : (
                    <EyeOff className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  )}
                  <span className="text-xs font-semibold" style={{ 
                    color: showOnlyThreats ? 'hsl(var(--danger))' : 'hsl(var(--muted-foreground))' 
                  }}>
                    {showOnlyThreats ? 'THREATS ONLY' : 'ALL ENDPOINTS'}
                  </span>
                </button>

                {/* Endpoint Count */}
                <div className="ml-auto card px-3 py-1.5">
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Tracking: <span className="font-bold text-primary-gold">{mapDots.length}</span>
                  </span>
                </div>
              </div>

              {/* War Room Map Container - Military HUD */}
              <div 
                className="relative rounded-lg overflow-hidden"
                style={{ 
                  height: '550px',
                  backgroundColor: '#0a0a0a',
                  backgroundImage: `
                    repeating-linear-gradient(0deg, #333 0px, #333 1px, transparent 1px, transparent 40px),
                    repeating-linear-gradient(90deg, #333 0px, #333 1px, transparent 1px, transparent 40px),
                    radial-gradient(circle at 50% 50%, rgba(242, 199, 68, 0.03) 0%, transparent 70%)
                  `,
                  border: '2px solid #333',
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={(e) => {
                  setIsDragging(true);
                  setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
                }}
                onMouseMove={(e) => {
                  if (isDragging) {
                    setPanOffset({
                      x: e.clientX - dragStart.x,
                      y: e.clientY - dragStart.y
                    });
                  }
                }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
              >
                {/* Military Scanning Line Effect */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, transparent 0%, rgba(242, 199, 68, 0.08) 50%, transparent 100%)',
                    animation: 'militaryScan 5s linear infinite',
                    zIndex: 1
                  }}
                />

                {/* Scalable Map Content */}
                <div 
                  className="absolute inset-0"
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                  }}
                >
                  {/* SVG Layer for Attack Arcs */}
                  <svg 
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 5 }}
                  >
                    <defs>
                      <linearGradient id="attackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(239, 68, 68, 0)" />
                        <stop offset="50%" stopColor="rgba(239, 68, 68, 0.8)" />
                        <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                      </linearGradient>
                    </defs>
                    {attackArcs.map((arc) => {
                      const now = Date.now();
                      const elapsed = now - arc.timestamp;
                      const progress = Math.min(elapsed / 2000, 1); // 2 second animation
                      const opacity = 1 - progress;
                      
                      // Calculate Bezier curve control point (arc)
                      const midX = (arc.sourceX + arc.targetX) / 2;
                      const midY = (arc.sourceY + arc.targetY) / 2 - 10; // Curve upward
                      
                      return (
                        <path
                          key={arc.id}
                          d={`M ${arc.sourceX} ${arc.sourceY} Q ${midX} ${midY} ${arc.targetX} ${arc.targetY}`}
                          fill="none"
                          stroke="url(#attackGradient)"
                          strokeWidth="2"
                          opacity={opacity}
                          style={{
                            strokeDasharray: 100,
                            strokeDashoffset: 100 * (1 - progress),
                            filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))'
                          }}
                        />
                      );
                    })}
                  </svg>

                  {/* Map Dots (Endpoints) */}
                  {mapDots.map((dot) => (
                    <div
                      key={dot.id}
                      className="absolute transition-all duration-300 cursor-pointer"
                      style={{
                        left: `${dot.x}%`,
                        top: `${dot.y}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: hoveredDot === dot.id ? 20 : 10
                      }}
                      onMouseEnter={() => setHoveredDot(dot.id)}
                      onMouseLeave={() => setHoveredDot(null)}
                      onClick={() => navigate(`/endpoints/${dot.hostname}`)}
                      title={`${dot.hostname} - ${dot.isOffline ? 'OFFLINE' : dot.isThreat ? 'THREAT' : 'ONLINE'}`}
                    >
                      {/* Threat Reticle Overlay */}
                      {dot.isThreat && (
                        <div 
                          className="absolute inset-0"
                          style={{
                            transform: 'scale(2.5)',
                            animation: 'pulse 2s ease-in-out infinite'
                          }}
                        >
                          {/* Crosshair lines */}
                          <div className="absolute top-0 left-1/2 w-0.5 h-2 -translate-x-1/2 -translate-y-full bg-danger" />
                          <div className="absolute bottom-0 left-1/2 w-0.5 h-2 -translate-x-1/2 translate-y-full bg-danger" />
                          <div className="absolute left-0 top-1/2 w-2 h-0.5 -translate-x-full -translate-y-1/2 bg-danger" />
                          <div className="absolute right-0 top-1/2 w-2 h-0.5 translate-x-full -translate-y-1/2 bg-danger" />
                        </div>
                      )}

                      {/* Endpoint Dot */}
                      <div
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                          dot.isThreat ? 'animate-pulse' : ''
                        }`}
                        style={{
                          backgroundColor: dot.isThreat 
                            ? '#ef4444' 
                            : dot.isActive 
                              ? '#10b981' 
                              : '#666',
                          borderColor: dot.isThreat 
                            ? '#ef4444' 
                            : dot.isActive 
                              ? '#F2C744' 
                              : '#999',
                          boxShadow: dot.isThreat 
                            ? '0 0 20px #ef4444, 0 0 40px rgba(239, 68, 68, 0.4)' 
                            : dot.isActive 
                              ? '0 0 10px #F2C744' 
                              : '0 0 5px rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        {/* Ripple effect */}
                        {dot.isActive && (
                          <div 
                            className="absolute inset-0 rounded-full"
                            style={{
                              backgroundColor: dot.isThreat ? '#ef4444' : '#10b981',
                              animation: 'ripple 2s ease-out infinite'
                            }}
                          />
                        )}
                      </div>

                      {/* Offline Ring */}
                      {dot.isOffline && (
                        <div 
                          className="absolute inset-0 rounded-full border-2"
                          style={{
                            borderColor: '#666',
                            transform: 'scale(1.5)',
                            opacity: 0.5
                          }}
                        />
                      )}

                      {/* Glassmorphic Tooltip */}
                      {hoveredDot === dot.id && (
                        <div 
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-64 p-3 rounded-lg pointer-events-none"
                          style={{
                            backgroundColor: 'rgba(10, 10, 10, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(242, 199, 68, 0.3)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(242, 199, 68, 0.1)',
                            zIndex: 50
                          }}
                        >
                          <div className="space-y-2">
                            {/* Hostname */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold" style={{ color: '#F2C744' }}>
                                {dot.hostname}
                              </span>
                              {dot.isThreat && (
                                <Target className="h-4 w-4" style={{ color: '#ef4444' }} />
                              )}
                            </div>
                            
                            {/* IP Address */}
                            {dot.ipAddress && (
                              <div className="text-xs">
                                <span style={{ color: '#999' }}>IP: </span>
                                <span style={{ color: '#fff' }}>{dot.ipAddress}</span>
                              </div>
                            )}
                            
                            {/* Risk Level */}
                            {dot.riskLevel && (
                              <div className="text-xs">
                                <span style={{ color: '#999' }}>Risk: </span>
                                <span style={{ 
                                  color: dot.riskLevel === 'CRITICAL' ? '#ef4444' : 
                                         dot.riskLevel === 'HIGH' ? '#f97316' : 
                                         dot.riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981',
                                  fontWeight: 'bold'
                                }}>
                                  {dot.riskLevel}
                                </span>
                              </div>
                            )}
                            
                            {/* Vulnerabilities */}
                            {dot.vulnerabilities > 0 && (
                              <div className="text-xs">
                                <span style={{ color: '#999' }}>Vulnerabilities: </span>
                                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                  {dot.vulnerabilities}
                                </span>
                              </div>
                            )}
                            
                            {/* Status */}
                            <div className="text-xs pt-1 border-t" style={{ borderColor: '#333' }}>
                              <span style={{ color: '#999' }}>Status: </span>
                              <span style={{ 
                                color: dot.isOffline ? '#666' : dot.isThreat ? '#ef4444' : '#10b981'
                              }}>
                                {dot.isOffline ? 'OFFLINE' : dot.isThreat ? 'UNDER ATTACK' : 'OPERATIONAL'}
                              </span>
                            </div>
                            
                            {/* Click hint */}
                            <div className="text-xs pt-1 text-center" style={{ color: '#666' }}>
                              Click for details →
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Live Legend */}
                <div 
                  className="absolute bottom-4 right-4 p-3 rounded-lg"
                  style={{ 
                    backgroundColor: 'rgba(10, 10, 10, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid #333',
                    zIndex: 30
                  }}
                >
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }}
                      />
                      <span style={{ color: '#999' }}>Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: '#666' }}
                      />
                      <span style={{ color: '#999' }}>Idle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full animate-pulse" 
                        style={{ backgroundColor: '#ef4444', boxShadow: '0 0 12px #ef4444' }}
                      />
                      <span style={{ color: '#ef4444' }}>Threat</span>
                    </div>
                  </div>
                </div>

                {/* Corner Brackets - Military HUD Style */}
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 35 }}>
                  {/* Top Left */}
                  <div className="absolute top-0 left-0 w-12 h-12">
                    <div className="absolute top-0 left-0 w-full h-1" style={{ background: '#F2C744' }} />
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ background: '#F2C744' }} />
                  </div>
                  {/* Top Right */}
                  <div className="absolute top-0 right-0 w-12 h-12">
                    <div className="absolute top-0 right-0 w-full h-1" style={{ background: '#F2C744' }} />
                    <div className="absolute top-0 right-0 w-1 h-full" style={{ background: '#F2C744' }} />
                  </div>
                  {/* Bottom Left */}
                  <div className="absolute bottom-0 left-0 w-12 h-12">
                    <div className="absolute bottom-0 left-0 w-full h-1" style={{ background: '#F2C744' }} />
                    <div className="absolute bottom-0 left-0 w-1 h-full" style={{ background: '#F2C744' }} />
                  </div>
                  {/* Bottom Right */}
                  <div className="absolute bottom-0 right-0 w-12 h-12">
                    <div className="absolute bottom-0 right-0 w-full h-1" style={{ background: '#F2C744' }} />
                    <div className="absolute bottom-0 right-0 w-1 h-full" style={{ background: '#F2C744' }} />
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
                  onClick={() => navigate('/malware-scanner')}
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
                      <Shield 
                        className="h-5 w-5" 
                        style={{ color: 'hsl(var(--primary-gold))' }} 
                      />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Malware Scanner</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Detect threats & malware
                      </p>
                    </div>
                  </div>
                  <ArrowRight 
                    className="h-5 w-5 group-hover:translate-x-1 transition-transform" 
                    style={{ color: 'hsl(var(--primary-gold))' }}
                  />
                </button>

                {/* Resilience Intelligence */}
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
                  onClick={() => navigate('/team')}
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

                {/* Axon Engine Metrics */}
                <button
                  onClick={() => navigate('/axon-metrics')}
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
                      <Activity 
                        className="h-5 w-5" 
                        style={{ color: 'hsl(var(--primary-gold))' }} 
                      />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Axon Engine Metrics</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Real-time performance monitoring
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* War Room Animations */}
      <style>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        @keyframes militaryScan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};
