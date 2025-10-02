import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, AlertTriangle, Activity, LogOut, Settings } from 'lucide-react';

export const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary-gold">Voltaxe</h1>
        <p className="text-sm text-foreground opacity-70 mt-1">Clarity Hub</p>
      </div>

      <nav className="flex-1 p-4">
        <NavLink
          to="/snapshots"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${
              isActive
                ? 'bg-primary-gold/10 text-primary-gold'
                : 'text-foreground hover:text-accent-gold hover:bg-white/5'
            }`
          }
        >
          <Camera size={20} />
          <span>Snapshots</span>
        </NavLink>

        <NavLink
          to="/events"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${
              isActive
                ? 'bg-primary-gold/10 text-primary-gold'
                : 'text-foreground hover:text-accent-gold hover:bg-white/5'
            }`
          }
        >
          <Activity size={20} />
          <span>Live Events</span>
        </NavLink>

        <NavLink
          to="/alerts"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${
              isActive
                ? 'bg-primary-gold/10 text-primary-gold'
                : 'text-foreground hover:text-accent-gold hover:bg-white/5'
            }`
          }
        >
          <AlertTriangle size={20} />
          <span>Alerts</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${
              isActive
                ? 'bg-primary-gold/10 text-primary-gold'
                : 'text-foreground hover:text-accent-gold hover:bg-white/5'
            }`
          }
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-foreground hover:text-accent-gold hover:bg-white/5"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
