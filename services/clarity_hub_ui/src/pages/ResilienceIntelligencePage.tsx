import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ResilienceDashboardComponent } from '../components/ResilienceDashboard.tsx';
import { ResilienceScoreWidget } from '../components/ResilienceScoreWidget';
import { SecurityTrends } from '../components/SecurityTrends';
import { AxonEngineMonitor } from '../components/AxonEngineMonitor';
import { PathToGreen } from '../components/PathToGreen';
import { Shield, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { resilienceService } from '../services/api';
import { ResilienceDashboard } from '../types';

export const ResilienceIntelligencePage = () => {
  const [dashboard, setDashboard] = useState<ResilienceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreBonus, setScoreBonus] = useState(0); // Track bonus points from completed tasks
  const [priorityActionsCount, setPriorityActionsCount] = useState(0); // Track high-priority pending actions

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await resilienceService.getResilienceDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to fetch resilience dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle score updates from PathToGreen
  const handleScoreChange = (bonusPoints: number) => {
    setScoreBonus(bonusPoints);
    console.log(`📊 Score bonus updated: +${bonusPoints} points`);
  };

  // Handle priority actions count updates from PathToGreen
  const handlePriorityActionsUpdate = (count: number) => {
    setPriorityActionsCount(count);
    console.log(`⚠️  Priority actions count: ${count}`);
  };

  const getScoreStatus = () => {
    if (!dashboard) return 'Loading...';
    const score = dashboard.summary.average_score;
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'At Risk';
  };

  const getRiskLevel = () => {
    if (!dashboard) return 'Calculating...';
    const criticalCount = dashboard.summary.risk_distribution.CRITICAL || 0;
    const highCount = dashboard.summary.risk_distribution.HIGH || 0;
    
    if (criticalCount > 0) return 'Critical';
    if (highCount > 5) return 'High';
    if (highCount > 0) return 'Moderate';
    return 'Low';
  };

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
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="card p-4 hover-lift">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)' }}>
                  <Shield className="h-5 w-5" style={{ color: 'hsl(var(--primary-gold))' }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Security Score</p>
                  <p className="text-xl font-bold text-gradient-gold">
                    {loading ? '...' : dashboard ? `${Math.round(Math.min(100, dashboard.summary.average_score + scoreBonus))}%` : 'N/A'}
                  </p>
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
                  <p className="text-xl font-bold" style={{ color: 'hsl(var(--success))' }}>
                    {loading ? '...' : getRiskLevel()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="card p-4 hover-lift">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--accent-gold) / 0.1)' }}>
                  <Activity className="h-5 w-5" style={{ color: 'hsl(var(--accent-gold))' }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Endpoints</p>
                  <p className="text-xl font-bold" style={{ color: 'hsl(var(--accent-gold))' }}>
                    {loading ? '...' : dashboard ? dashboard.summary.total_endpoints : '0'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4 hover-lift">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: priorityActionsCount > 0 ? 'hsl(var(--danger) / 0.1)' : 'hsl(var(--success) / 0.1)' }}>
                  <AlertTriangle className="h-5 w-5" style={{ color: priorityActionsCount > 0 ? 'hsl(var(--danger))' : 'hsl(var(--success))' }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Priority Actions</p>
                  <p className="text-xl font-bold" style={{ color: priorityActionsCount > 0 ? 'hsl(var(--danger))' : 'hsl(var(--success))' }}>
                    {loading ? '...' : priorityActionsCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resilience Score Widget */}
        <div className="mb-8 animate-fadeIn">
          <ResilienceScoreWidget scoreBonus={scoreBonus} />
        </div>

        {/* Security Trends - Historical Score Analysis */}
        <div className="mb-8 animate-fadeIn">
          <SecurityTrends />
        </div>

        {/* Two Column Layout: Axon Engine Monitor & Path to Green */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-fadeIn">
          <AxonEngineMonitor />
          <PathToGreen 
            onScoreChange={handleScoreChange}
            onPriorityActionsUpdate={handlePriorityActionsUpdate}
          />
        </div>

        {/* Resilience Dashboard */}
        <div className="animate-fadeIn">
          <ResilienceDashboardComponent />
        </div>
      </main>
    </div>
  );
};
