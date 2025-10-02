import { Sidebar } from '../components/Sidebar';
import { ResilienceDashboardComponent } from '../components/ResilienceDashboard';
import { Shield, TrendingUp } from 'lucide-react';

export const ResilienceIntelligencePage = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Page Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 gradient-gold rounded-2xl flex items-center justify-center shadow-xl">
              <Shield size={32} style={{ color: 'hsl(var(--background))' }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient-gold mb-2">
                Resilience Intelligence
              </h1>
              <p className="text-muted-foreground flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" style={{ color: 'hsl(var(--primary-gold))' }} />
                AI-powered security resilience scoring and analysis powered by Axon Engine
              </p>
            </div>
          </div>
        </div>

        {/* Resilience Dashboard - All resilience related cards */}
        <ResilienceDashboardComponent />
      </main>
    </div>
  );
};
