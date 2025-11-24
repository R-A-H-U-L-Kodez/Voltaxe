import { useState, useRef, useEffect } from 'react';
import { Server, Laptop, MoreVertical, Eye, Scan, Shield, ShieldOff, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Endpoint } from '../types';
import { useNavigate } from 'react-router-dom';

interface EndpointCardProps {
  endpoint: Endpoint;
  onQuickScan: (endpointId: string) => void;
  onIsolate: (endpointId: string) => void;
  onUnisolate: (endpointId: string) => void;
}

export const EndpointCard = ({ endpoint, onQuickScan, onIsolate, onUnisolate }: EndpointCardProps) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get appropriate icon based on endpoint type
  const getTypeIcon = () => {
    switch (endpoint.type) {
      case 'server':
        return <Server className="h-8 w-8" style={{ color: 'hsl(var(--primary-gold))' }} />;
      case 'laptop':
        return <Laptop className="h-8 w-8" style={{ color: 'hsl(var(--accent-gold))' }} />;
      default:
        return <Server className="h-8 w-8" style={{ color: 'hsl(var(--muted-foreground))' }} />;
    }
  };

  // Get status dot color
  const getStatusColor = () => {
    switch (endpoint.status) {
      case 'online':
        return 'hsl(var(--success))';
      case 'offline':
        return 'hsl(var(--muted-foreground))';
      case 'isolated':
        return 'hsl(var(--warning))';
      default:
        return 'hsl(var(--muted-foreground))';
    }
  };

  // Get risk badge styling
  const getRiskStyle = () => {
    switch (endpoint.risk_level) {
      case 'CRITICAL':
        return { bg: 'hsl(var(--danger) / 0.15)', color: 'hsl(var(--danger))', border: 'hsl(var(--danger) / 0.4)' };
      case 'HIGH':
        return { bg: 'hsl(var(--warning) / 0.15)', color: 'hsl(var(--warning))', border: 'hsl(var(--warning) / 0.4)' };
      case 'MEDIUM':
        return { bg: 'hsl(var(--accent-gold) / 0.15)', color: 'hsl(var(--accent-gold))', border: 'hsl(var(--accent-gold) / 0.4)' };
      case 'LOW':
        return { bg: 'hsl(var(--success) / 0.15)', color: 'hsl(var(--success))', border: 'hsl(var(--success) / 0.4)' };
      default:
        return { bg: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: 'hsl(var(--border))' };
    }
  };

  const riskStyle = getRiskStyle();
  const statusColor = getStatusColor();

  // Format last seen time
  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleString();
  };

  const handleViewDetails = () => {
    setShowMenu(false);
    navigate(`/fleet/endpoint/${endpoint.id}`);
  };

  const handleQuickScan = () => {
    setShowMenu(false);
    onQuickScan(endpoint.id);
  };

  const handleIsolate = () => {
    setShowMenu(false);
    if (endpoint.status === 'isolated') {
      onUnisolate(endpoint.id);
    } else {
      onIsolate(endpoint.id);
    }
  };

  return (
    <div
      className="card p-5 hover:shadow-xl transition-all duration-300 relative group"
      style={{
        backgroundColor: 'hsl(var(--card))',
        border: `2px solid ${endpoint.status === 'online' ? 'hsl(var(--success) / 0.3)' : 'hsl(var(--border))'}`,
      }}
    >
      {/* Status Indicator Dot */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full animate-pulse"
          style={{
            backgroundColor: statusColor,
            boxShadow: `0 0 10px ${statusColor}`,
          }}
        />
        {/* Quick Actions Menu Button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg hover:bg-opacity-80 transition-smooth opacity-0 group-hover:opacity-100"
            style={{ backgroundColor: 'hsl(var(--muted))' }}
          >
            <MoreVertical className="h-5 w-5" style={{ color: 'hsl(var(--foreground))' }} />
          </button>

          {/* Context Menu */}
          {showMenu && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl z-50 py-2"
              style={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <button
                onClick={handleViewDetails}
                className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-opacity-80 transition-smooth"
                style={{ backgroundColor: 'transparent', color: 'hsl(var(--foreground))' }}
              >
                <Eye className="h-4 w-4" />
                View Details
              </button>
              <button
                onClick={handleQuickScan}
                className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-opacity-80 transition-smooth"
                style={{ backgroundColor: 'transparent', color: 'hsl(var(--primary-gold))' }}
              >
                <Scan className="h-4 w-4" />
                Quick Scan
              </button>
              <div className="h-px my-1" style={{ backgroundColor: 'hsl(var(--border))' }} />
              <button
                onClick={handleIsolate}
                className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-opacity-80 transition-smooth"
                style={{
                  backgroundColor: 'transparent',
                  color: endpoint.status === 'isolated' ? 'hsl(var(--success))' : 'hsl(var(--danger))',
                }}
              >
                {endpoint.status === 'isolated' ? (
                  <>
                    <ShieldOff className="h-4 w-4" />
                    Remove Isolation
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Isolate Endpoint
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Identity Section */}
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted))' }}>
          {getTypeIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold truncate mb-1" style={{ color: 'hsl(var(--foreground))' }}>
            {endpoint.hostname}
          </h3>
          <p className="text-sm truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {endpoint.os_version || endpoint.os}
          </p>
        </div>
      </div>

      {/* Network Identity */}
      <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--primary-gold))' }} />
          <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>IP ADDRESS</span>
        </div>
        <p className="text-sm font-mono font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
          {endpoint.ip_address}
        </p>
      </div>

      {/* Security State */}
      <div className="space-y-3 mb-4">
        {/* Risk Badge */}
        <div
          className="inline-flex px-3 py-1 rounded-full text-xs font-bold"
          style={{
            backgroundColor: riskStyle.bg,
            color: riskStyle.color,
            border: `1px solid ${riskStyle.border}`,
          }}
        >
          {endpoint.risk_level} RISK
        </div>

        {/* Vulnerability Count */}
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(var(--warning))' }} />
          <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
            {endpoint.vulnerability_count} Vulnerabilities
          </span>
          {endpoint.critical_count > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: 'hsl(var(--danger))', color: 'white' }}
            >
              {endpoint.critical_count} critical
            </span>
          )}
        </div>

        {/* Agent Status */}
        <div className="flex items-center gap-2">
          {endpoint.agent.status === 'running' ? (
            <CheckCircle className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />
          ) : (
            <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(var(--danger))' }} />
          )}
          <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Agent: <span className="font-medium" style={{ color: endpoint.agent.status === 'running' ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>{endpoint.agent.status}</span>
          </span>
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            v{endpoint.agent.version}
          </span>
        </div>
      </div>

      {/* Liveness */}
      <div className="pt-3 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Last Seen</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            {formatLastSeen(endpoint.last_seen)}
          </span>
        </div>
      </div>
    </div>
  );
};
