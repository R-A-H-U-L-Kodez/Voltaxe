import { Sidebar } from '../components/Sidebar';
import { ResilienceDashboardComponent } from '../components/ResilienceDashboard.tsx';
import { ResilienceScoreWidget } from '../components/ResilienceScoreWidget';

export const ResilienceIntelligencePage = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />

      <main className="ml-64 p-8">
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
