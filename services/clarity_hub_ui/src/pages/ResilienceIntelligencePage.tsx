import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ResilienceDashboardComponent } from '../components/ResilienceDashboard.tsx';
import { NorthStarScore } from '../components/NorthStarScore';
import { RiskBreakdown } from '../components/RiskBreakdown';
import { AxonEngineMonitor } from '../components/AxonEngineMonitor';
import { PathToGreen } from '../components/PathToGreen';
import { Shield, Download, FileText } from 'lucide-react';
import { resilienceService } from '../services/api';
import { ResilienceDashboard } from '../types';

export const ResilienceIntelligencePage = () => {
  const [dashboard, setDashboard] = useState<ResilienceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreBonus, setScoreBonus] = useState(0);
  const [priorityActionsCount, setPriorityActionsCount] = useState(0);
  const [previousScore, setPreviousScore] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await resilienceService.getResilienceDashboard();
      
      // Store previous score before updating
      if (dashboard) {
        setPreviousScore(Math.round(dashboard.summary.average_score));
      }
      
      setDashboard(data);
    } catch (error) {
      console.error('Failed to fetch resilience dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleScoreChange = (bonusPoints: number) => {
    setScoreBonus(bonusPoints);
  };

  const handlePriorityActionsUpdate = (count: number) => {
    setPriorityActionsCount(count);
  };

  const currentScore = dashboard ? Math.min(100, dashboard.summary.average_score + scoreBonus) : 0;

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    alert('PDF export coming soon! This will generate an executive summary report.');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Page Header with Export Button */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 gradient-gold rounded-2xl flex items-center justify-center shadow-xl">
                <Shield size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gradient-gold">Resilience Intelligence</h1>
                <p className="mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Security Gamification Engine • Real-time AI Analysis
                </p>
              </div>
            </div>
            
            {/* PDF Export Button */}
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{
                backgroundColor: 'hsl(var(--primary-gold))',
                color: 'hsl(var(--background))'
              }}
            >
              <Download size={20} />
              Export Monthly Report
            </button>
          </div>
        </div>

        {/* North Star Score - The Hero Section */}
        <div className="mb-8 animate-fadeIn">
          <NorthStarScore 
            score={currentScore}
            previousScore={previousScore}
            loading={loading}
          />
        </div>

        {/* Two Column: Risk Breakdown & Path to Green */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-fadeIn">
          <RiskBreakdown />
          <PathToGreen 
            onScoreChange={handleScoreChange}
            onPriorityActionsUpdate={handlePriorityActionsUpdate}
          />
        </div>

        {/* Two Column: Axon Engine Monitor & Detailed Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-fadeIn">
          <AxonEngineMonitor />
          <div 
            className="rounded-2xl p-6 border"
            style={{ 
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <FileText size={24} style={{ color: 'hsl(var(--primary-gold))' }} />
              <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                Quick Stats
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--background))' }}>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Total Endpoints</span>
                <span className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                  {loading ? '...' : dashboard?.summary.total_endpoints || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--background))' }}>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Critical Risks</span>
                <span className="text-xl font-bold text-red-500">
                  {loading ? '...' : dashboard?.summary.risk_distribution.CRITICAL || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--background))' }}>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>High Risks</span>
                <span className="text-xl font-bold text-orange-500">
                  {loading ? '...' : dashboard?.summary.risk_distribution.HIGH || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--background))' }}>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Priority Actions</span>
                <span className="text-xl font-bold" style={{ color: priorityActionsCount > 0 ? '#ef4444' : '#10b981' }}>
                  {priorityActionsCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Resilience Dashboard */}
        <div className="animate-fadeIn">
          <ResilienceDashboardComponent />
        </div>
      </main>
    </div>
  );
};
