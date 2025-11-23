import { Sidebar } from '../components/Sidebar';
import { ResilienceDashboardComponent } from '../components/ResilienceDashboard.tsx';
import { ResilienceScoreWidget } from '../components/ResilienceScoreWidget';
import { SecurityTrends } from '../components/SecurityTrends';
import { AxonEngineMonitor } from '../components/AxonEngineMonitor';
import { PathToGreen } from '../components/PathToGreen';
import { Shield, TrendingUp, Activity } from 'lucide-react';

export const ResilienceIntelligencePage = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Page Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 gradient-gold rounded-2xl flex items-center justify-center shadow-xl">
              <Shield size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient-gold">Resilience Intelligence</h1>
              <p className="mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Real-time security posture analysis powered by AI</p>
            </div>
          </div>
          
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="card p-4 hover-lift">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)' }}>
                  <Shield className="h-5 w-5" style={{ color: 'hsl(var(--primary-gold))' }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Security Score</p>
                  <p className="text-xl font-bold text-gradient-gold">Real-time</p>
                </div>
              </div>
            </div>
            
            <div className="card p-4 hover-lift">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--success) / 0.1)' }}>
                  <TrendingUp className="h-5 w-5" style={{ color: 'hsl(var(--success))' }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Risk Assessment</p>
                  <p className="text-xl font-bold" style={{ color: 'hsl(var(--success))' }}>Active</p>
                </div>
              </div>
            </div>
            
            <div className="card p-4 hover-lift">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--accent-gold) / 0.1)' }}>
                  <Activity className="h-5 w-5" style={{ color: 'hsl(var(--accent-gold))' }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Monitoring</p>
                  <p className="text-xl font-bold" style={{ color: 'hsl(var(--accent-gold))' }}>Continuous</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resilience Score Widget */}
        <div className="mb-8 animate-fadeIn">
          <ResilienceScoreWidget />
        </div>

        {/* Security Trends - Historical Score Analysis */}
        <div className="mb-8 animate-fadeIn">
          <SecurityTrends />
        </div>

        {/* Two Column Layout: Axon Engine Monitor & Path to Green */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-fadeIn">
          <AxonEngineMonitor />
          <PathToGreen />
        </div>

        {/* Resilience Dashboard */}
        <div className="animate-fadeIn">
          <ResilienceDashboardComponent />
        </div>
      </main>
    </div>
  );
};
