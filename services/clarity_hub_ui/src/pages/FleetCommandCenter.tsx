import { useState } from 'react';
import { Shield, Activity, Camera } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { FleetLiveView } from '../components/fleet/FleetLiveView';
import { FleetSnapshotsView } from '../components/fleet/FleetSnapshotsView';

type TabType = 'live' | 'snapshots';

export const FleetCommandCenter = () => {
  const [activeTab, setActiveTab] = useState<TabType>('live');

  const tabs = [
    {
      id: 'live' as TabType,
      label: 'Live View',
      icon: Activity,
      description: 'Real-time endpoint monitoring and control',
    },
    {
      id: 'snapshots' as TabType,
      label: 'Security History',
      icon: Camera,
      description: 'Historical security snapshots and audit trail',
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />
      
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="border-b pb-6 mb-6" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)' }}>
              <Shield className="h-10 w-10" style={{ color: 'hsl(var(--primary-gold))' }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                Fleet Command Center
              </h1>
              <p className="text-lg mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Unified endpoint monitoring, management, and security intelligence
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-3 px-6 py-3 rounded-t-lg transition-all duration-300 relative"
                  style={{
                    backgroundColor: isActive ? 'hsl(var(--card))' : 'transparent',
                    color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                    borderBottom: isActive ? '3px solid hsl(var(--primary-gold))' : '3px solid transparent',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">{tab.label}</div>
                    <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {tab.description}
                    </div>
                  </div>
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full"
                      style={{
                        backgroundColor: 'hsl(var(--primary-gold))',
                        boxShadow: '0 0 10px hsl(var(--primary-gold))',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'live' && <FleetLiveView />}
          {activeTab === 'snapshots' && <FleetSnapshotsView />}
        </div>
      </main>
    </div>
  );
};
