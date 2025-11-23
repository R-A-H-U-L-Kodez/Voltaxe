import { Sidebar } from '../components/Sidebar';
import { ResilienceDashboardComponent } from '../components/ResilienceDashboard';
import { ResilienceScoreWidget } from '../components/ResilienceScoreWidget';
import { Shield, Activity } from 'lucide-react';

export const ResilienceIntelligencePage = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)', border: '1px solid hsl(var(--primary-gold) / 0.2)' }}>
              <Shield size={28} style={{ color: 'hsl(var(--primary-gold))' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                Resilience Intelligence
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Activity className="h-4 w-4" />
                AI-powered security resilience scoring and analysis
              </p>
            </div>
          </div>
        </div>

        {/* Resilience Score Widget */}
        <div className="mb-8">
          <ResilienceScoreWidget />
        </div>

        {/* Resilience Dashboard */}
        <ResilienceDashboardComponent />
      </main>
    </div>
  );
};
