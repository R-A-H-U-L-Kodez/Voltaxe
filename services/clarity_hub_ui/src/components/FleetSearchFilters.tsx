import { useState } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { EndpointStatus, EndpointRisk, OSType } from '../types';

interface FleetSearchFiltersProps {
  onSearchChange: (search: string) => void;
  onStatusChange: (status: EndpointStatus | 'all') => void;
  onRiskChange: (risk: EndpointRisk | 'all') => void;
  onOSChange: (os: OSType | 'all') => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const FleetSearchFilters = ({
  onSearchChange,
  onStatusChange,
  onRiskChange,
  onOSChange,
  onRefresh,
  isRefreshing = false,
}: FleetSearchFiltersProps) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EndpointStatus | 'all'>('all');
  const [risk, setRisk] = useState<EndpointRisk | 'all'>('all');
  const [os, setOS] = useState<OSType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  const handleStatusChange = (value: EndpointStatus | 'all') => {
    setStatus(value);
    onStatusChange(value);
  };

  const handleRiskChange = (value: EndpointRisk | 'all') => {
    setRisk(value);
    onRiskChange(value);
  };

  const handleOSChange = (value: OSType | 'all') => {
    setOS(value);
    onOSChange(value);
  };

  const activeFiltersCount = [status !== 'all', risk !== 'all', os !== 'all'].filter(Boolean).length;

  return (
    <div className="card p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Global Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input
            type="text"
            placeholder="Search by Hostname, IP Address, or OS..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border transition-smooth"
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-smooth hover:opacity-80 relative"
          style={{
            backgroundColor: showFilters ? 'hsl(var(--primary-gold))' : 'hsl(var(--muted))',
            color: showFilters ? 'white' : 'hsl(var(--foreground))',
          }}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: 'hsl(var(--danger))',
                color: 'white',
              }}
            >
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-smooth hover:opacity-80"
          style={{
            backgroundColor: 'hsl(var(--accent-gold))',
            color: 'white',
          }}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Status
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as EndpointStatus | 'all')}
              className="w-full px-3 py-2 rounded-lg border transition-smooth"
              style={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="isolated">Isolated</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Risk Level
            </label>
            <select
              value={risk}
              onChange={(e) => handleRiskChange(e.target.value as EndpointRisk | 'all')}
              className="w-full px-3 py-2 rounded-lg border transition-smooth"
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

          {/* OS Filter */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Operating System
            </label>
            <select
              value={os}
              onChange={(e) => handleOSChange(e.target.value as OSType | 'all')}
              className="w-full px-3 py-2 rounded-lg border transition-smooth"
              style={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            >
              <option value="all">All OS</option>
              <option value="Windows">Windows</option>
              <option value="Linux">Linux</option>
              <option value="macOS">macOS</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
