import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Camera, 
  AlertTriangle, 
  Activity, 
  LogOut, 
  Settings, 
  Shield
} from 'lucide-react';

export const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col overflow-y-auto">
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

      <nav className="flex-1 p-4">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-smooth ${
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
          to="/snapshots"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-smooth ${
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
          <Camera size={20} />
          <span>Snapshots</span>
        </NavLink>

        <NavLink
          to="/events"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-smooth ${
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
          <Activity size={20} />
          <span>Live Events</span>
        </NavLink>

        <NavLink
          to="/alerts"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-smooth ${
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
          <AlertTriangle size={20} />
          <span>Alerts</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-smooth ${
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
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-foreground hover:text-accent-gold hover:bg-white/5 transition-smooth"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
