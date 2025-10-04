import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, TrendingUp, AlertCircle, Shield, FileWarning, Activity } from 'lucide-react';
import apiClient from '../services/api';

interface SearchResult {
  type: 'endpoint' | 'alert' | 'cve' | 'malware' | 'event';
  id: string | number;
  title: string;
  subtitle?: string;
  severity?: string;
  url: string;
  icon: any;
}

interface SearchResponse {
  endpoints: any[];
  alerts: any[];
  cves: any[];
  malware: any[];
  events: any[];
}

export const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Search function with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<SearchResponse>(`/search?q=${encodeURIComponent(query)}`);
        const data = response.data;
        
        const formattedResults: SearchResult[] = [];

        // Endpoints
        data.endpoints?.forEach((endpoint: any) => {
          formattedResults.push({
            type: 'endpoint',
            id: endpoint.id,
            title: endpoint.hostname,
            subtitle: `${endpoint.ip_address} • ${endpoint.os}`,
            url: `/snapshots/${endpoint.id}`,
            icon: Shield
          });
        });

        // Alerts
        data.alerts?.forEach((alert: any) => {
          formattedResults.push({
            type: 'alert',
            id: alert.id,
            title: alert.event_type,
            subtitle: alert.hostname || alert.details?.substring(0, 60),
            severity: alert.severity,
            url: '/alerts',
            icon: AlertCircle
          });
        });

        // CVEs
        data.cves?.forEach((cve: any) => {
          formattedResults.push({
            type: 'cve',
            id: cve.cve_id,
            title: cve.cve_id,
            subtitle: cve.description?.substring(0, 80) || cve.hostname,
            severity: cve.severity,
            url: '/alerts',
            icon: TrendingUp
          });
        });

        // Malware
        data.malware?.forEach((malware: any) => {
          formattedResults.push({
            type: 'malware',
            id: malware.id,
            title: malware.file_name || malware.file_path,
            subtitle: malware.is_malicious ? `Malicious - ${malware.malware_family || 'Unknown'}` : 'Clean',
            severity: malware.is_malicious ? 'critical' : 'low',
            url: '/malware',
            icon: FileWarning
          });
        });

        // Events
        data.events?.forEach((event: any) => {
          formattedResults.push({
            type: 'event',
            id: event.id,
            title: event.type || event.event_type,
            subtitle: event.hostname || event.details?.substring(0, 60),
            url: '/events',
            icon: Activity
          });
        });

        setResults(formattedResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyNav = (e: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyNav);
    return () => window.removeEventListener('keydown', handleKeyNav);
  }, [isOpen, results, selectedIndex]);

  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    // Navigate
    navigate(result.url);
    setIsOpen(false);
    setQuery('');
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-foreground';
    }
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'endpoint': return 'Endpoints';
      case 'alert': return 'Alerts';
      case 'cve': return 'CVEs';
      case 'malware': return 'Malware';
      case 'event': return 'Events';
      default: return 'Results';
    }
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
          size={18} 
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search endpoints, alerts, CVEs... (⌘K)"
          className="w-full pl-10 pr-10 py-2 bg-input border border-border rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary-gold transition-smooth"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-[500px] overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-muted-foreground">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-gold"></div>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No results found for "{query}"</p>
            </div>
          )}

          {!loading && query && results.length > 0 && (
            <div>
              {Object.entries(groupedResults).map(([type, items]) => (
                <div key={type} className="border-b border-border last:border-b-0">
                  <div className="px-4 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {getCategoryLabel(type)} ({items.length})
                  </div>
                  {items.map((result) => {
                    const globalIndex = results.indexOf(result);
                    const Icon = result.icon;
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-primary-gold/10 transition-smooth text-left ${
                          globalIndex === selectedIndex ? 'bg-primary-gold/10' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${
                          result.severity ? getSeverityColor(result.severity) + ' bg-current/10' : 'bg-primary-gold/10'
                        }`}>
                          <Icon size={16} className={result.severity ? getSeverityColor(result.severity) : 'text-primary-gold'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">{result.title}</div>
                          {result.subtitle && (
                            <div className="text-sm text-muted-foreground truncate">{result.subtitle}</div>
                          )}
                        </div>
                        {result.severity && (
                          <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(result.severity)} bg-current/10 uppercase`}>
                            {result.severity}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {!query && recentSearches.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-muted/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRecentSearchClick(search)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-primary-gold/10 transition-smooth text-left"
                >
                  <Clock size={16} className="text-muted-foreground" />
                  <span className="text-foreground">{search}</span>
                </button>
              ))}
            </div>
          )}

          {!query && recentSearches.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Search for endpoints, alerts, CVEs, or malware</p>
              <p className="text-xs mt-2 opacity-70">Press ⌘K or Ctrl+K to focus</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
