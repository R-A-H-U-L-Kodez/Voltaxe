import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  Settings, 
  Shield,
  Users,
  PlusCircle,
  Target,
  LayoutDashboard,
  Layers,
  Network,
  Rocket,
  Bug,
  AlertTriangle
} from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { useState, useEffect } from 'react';
import { threatsService, ThreatStats } from '../services/threatsApi';

export const Sidebar = () => {
  const { logout } = useAuth();
  const [threatStats, setThreatStats] = useState<ThreatStats>({
    totalThreats: 0,
    criticalThreats: 0,
    generalAlerts: 0,
    rootkitAlerts: 0,
    activeAlerts: 0,
    resolvedAlerts: 0
  });

  useEffect(() => {
    const fetchThreatStats = async () => {
      try {
        const stats = await threatsService.getStats();
        setThreatStats(stats);
      } catch (error) {
        console.error('Failed to fetch threat statistics:', error);
        setThreatStats({
          totalThreats: 0,
          criticalThreats: 0,
          generalAlerts: 0,
          rootkitAlerts: 0,
          activeAlerts: 0,
          resolvedAlerts: 0
        });
      }
    };

    fetchThreatStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchThreatStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col overflow-y-auto z-50" style={{ pointerEvents: 'auto' }}>
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 gradient-gold rounded-lg flex items-center justify-center">
            <Shield size={20} style={{ color: 'hsl(var(--background))' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient-gold">Voltaxe</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Clarity Hub</p>
      </div>

      {/* Global Search */}
      <div className="p-4 border-b border-border">
        <GlobalSearch />
      </div>

      <nav className="flex-1 p-4">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-smooth cursor-pointer ${
              isActive
                ? 'bg-primary-gold/10 text-primary-gold glow-gold'
                : 'text-foreground hover:text-accent-gold hover:bg-white/5'
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'hsl(var(--primary-gold))' : undefined,
            backgroundColor: isActive ? 'hsl(var(--primary-gold) / 0.1)' : undefined
          })}
        >
          <LayoutDashboard size={20} />
          <span className="font-medium">Command Center</span>
        </NavLink>

        <NavLink
          to="/resilience"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-smooth cursor-pointer ${
              isActive
                ? 'bg-primary-gold/10 text-primary-gold glow-gold'
                : 'text-foreground hover:text-accent-gold hover:bg-white/5'
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'hsl(var(--primary-gold))' : undefined,
            backgroundColor: isActive ? 'hsl(var(--primary-gold) / 0.1)' : undefined
          })}
        >
          <Shield size={20} />
          <span className="font-medium">Resilience Intelligence</span>
        </NavLink>

        <NavLink
          to="/fleet"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-smooth cursor-pointer ${
              isActive
                ? 'bg-primary-gold/10 text-primary-gold'
                : 'text-foreground hover:text-accent-gold hover:bg-white/5'
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'hsl(var(--primary-gold))' : undefined,
            backgroundColor: isActive ? 'hsl(var(--primary-gold) / 0.1)' : undefined
          })}
        >
          <Layers size={20} />
          <span>Fleet Command</span>
        </NavLink>

        {/* Unified Threats Section */}
        <NavLink
          to="/alerts"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-smooth cursor-pointer relative ${
              isActive
                ? 'bg-primary-gold/10 text-primary-gold glow-gold'
                : 'text-foreground hover:text-accent-gold hover:bg-white/5'
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'hsl(var(--primary-gold))' : undefined,
            backgroundColor: isActive ? 'hsl(var(--primary-gold) / 0.1)' : undefined
          })}
        >
          <AlertTriangle size={20} />
          <span className="font-medium">Threats</span>
          {threatStats.activeAlerts > 0 && (
            <span className="ml-auto bg-danger text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center font-semibold">
              {threatStats.activeAlerts > 99 ? '99+' : threatStats.activeAlerts}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/incidents"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-smooth cursor-pointer ${
              isActive
                ? 'bg-primary-gold/10 text-primary-gold'
                : 'text-foreground hover:text-accent-gold hover:bg-white/5'
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'hsl(var(--primary-gold))' : undefined,
            backgroundColor: isActive ? 'hsl(var(--primary-gold) / 0.1)' : undefined
          })}
        >
          <Target size={20} />
          <span>Incidents</span>
        </NavLink>

        <NavLink
          to="/traffic"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-smooth cursor-pointer ${
              isActive
                ? 'bg-primary-gold/10 text-primary-gold'
                : 'text-foreground hover:text-accent-gold hover:bg-white/5'
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'hsl(var(--primary-gold))' : undefined,
            backgroundColor: isActive ? 'hsl(var(--primary-gold) / 0.1)' : undefined
          })}
        >
          <Network size={20} />
          <span>Network Traffic</span>
        </NavLink>

        <NavLink
          to="/live-telemetry"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-smooth cursor-pointer ${
              isActive
                ? 'bg-primary-gold/10 text-primary-gold glow-gold'
                : 'text-foreground hover:text-accent-gold hover:bg-white/5'
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'hsl(var(--primary-gold))' : undefined,
            backgroundColor: isActive ? 'hsl(var(--primary-gold) / 0.1)' : undefined
          })}
        >
          <Rocket size={20} />
          <span>Live Telemetry</span>
        </NavLink>

        <NavLink
          to="/malware-scanner"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-smooth cursor-pointer ${
              isActive
                ? 'bg-primary-gold/10 text-primary-gold'
                : 'text-foreground hover:text-accent-gold hover:bg-white/5'
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'hsl(var(--primary-gold))' : undefined,
            backgroundColor: isActive ? 'hsl(var(--primary-gold) / 0.1)' : undefined
          })}
        >
          <Bug size={20} />
          <span>Malware Scanner</span>
        </NavLink>

        <NavLink
          to="/team"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-smooth cursor-pointer ${
              isActive
                ? 'bg-primary-gold/10 text-primary-gold'
                : 'text-foreground hover:text-accent-gold hover:bg-white/5'
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'hsl(var(--primary-gold))' : undefined,
            backgroundColor: isActive ? 'hsl(var(--primary-gold) / 0.1)' : undefined
          })}
        >
          <Users size={20} />
          <span>Team</span>
        </NavLink>

        <NavLink
          to="/add-endpoint"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-smooth cursor-pointer ${
              isActive
                ? 'bg-primary-gold/10 text-primary-gold'
                : 'text-foreground hover:text-accent-gold hover:bg-white/5'
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'hsl(var(--primary-gold))' : undefined,
            backgroundColor: isActive ? 'hsl(var(--primary-gold) / 0.1)' : undefined
          })}
        >
          <PlusCircle size={20} />
          <span>Add Endpoint</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-smooth cursor-pointer ${
              isActive
                ? 'bg-primary-gold/10 text-primary-gold'
                : 'text-foreground hover:text-accent-gold hover:bg-white/5'
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'hsl(var(--primary-gold))' : undefined,
            backgroundColor: isActive ? 'hsl(var(--primary-gold) / 0.1)' : undefined
          })}
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-foreground hover:text-accent-gold hover:bg-white/5 transition-smooth cursor-pointer"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
