import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { resilienceService } from '../services/api';
import { ResilienceDashboard } from '../types';

interface ResilienceScoreWidgetProps {
  className?: string;
  scoreBonus?: number; // Bonus points from completed Path to Green tasks
}

export const ResilienceScoreWidget: React.FC<ResilienceScoreWidgetProps> = ({ className, scoreBonus = 0 }) => {
  const [dashboard, setDashboard] = useState<ResilienceDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await resilienceService.getResilienceDashboard();
        setDashboard(data);
      } catch (error) {
        console.error('Failed to fetch resilience data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--success))';
    if (score >= 60) return 'hsl(var(--warning))';
    if (score >= 40) return 'hsl(var(--accent-gold))';
    return 'hsl(var(--danger))';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return 'Excellent security posture';
    if (score >= 60) return 'Good security posture';
    if (score >= 40) return 'Moderate risk';
    return 'High risk - immediate action recommended';
  };

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-muted-foreground">Loading resilience data…</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  // Calculate actual score with bonus points
  const baseScore = dashboard.summary.average_score;
  const score = Math.min(100, baseScore + scoreBonus);
  const scoreColor = getScoreColor(score);
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`card ${className}`}>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Circle - Left Column */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: scoreColor }} />
                    <stop offset="100%" style={{ stopColor: scoreColor, stopOpacity: 0.7 }} />
                  </linearGradient>
                </defs>

                <circle cx="96" cy="96" r="90" stroke="hsl(var(--muted))" strokeWidth="12" fill="none" />
                <circle
                  cx="96"
                  cy="96"
                  r="90"
                  stroke="url(#scoreGradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold flex items-center gap-2" style={{ color: scoreColor }}>
                  {Math.round(score)}
                  {scoreBonus > 0 && (
                    <span className="text-2xl font-semibold" style={{ color: 'hsl(var(--success))' }}>
                      +{scoreBonus}
                    </span>
                  )}
                </div>
                <div className="text-lg font-semibold text-muted-foreground">
                  {getScoreGrade(score)}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  out of 100
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards - Right 2 Columns */}
          <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
            <div className="rounded-lg p-5" style={{ backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Security posture status
              </h3>
              <p className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                {getScoreDescription(score)}
              </p>
              {score < 60 && (
                <div className="flex items-start gap-2 mt-3 p-3 rounded-md" style={{ backgroundColor: 'hsl(var(--danger) / 0.1)' }}>
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--danger))' }} />
                  <p className="text-sm" style={{ color: 'hsl(var(--danger))' }}>
                    Review high-risk endpoints and take corrective action
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg p-4" style={{ backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Endpoints monitored
                </p>
                <p className="text-2xl font-bold" style={{ color: 'hsl(var(--primary-gold))' }}>
                  {dashboard.summary.total_endpoints}
                </p>
              </div>

              <div className="rounded-lg p-4" style={{ backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  High risk systems
                </p>
                <p className="text-2xl font-bold" style={{ color: 'hsl(var(--danger))' }}>
                  {dashboard.summary.risk_distribution.HIGH + dashboard.summary.risk_distribution.CRITICAL}
                </p>
              </div>
            </div>

            <div className="rounded-lg p-4" style={{ backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Risk distribution
                </p>
                <p className="text-xs text-muted-foreground">
                  {dashboard.summary.total_endpoints} total
                </p>
              </div>

              <div className="flex h-2 rounded-full overflow-hidden mb-3" style={{ backgroundColor: 'hsl(var(--background))' }}>
                {dashboard.summary.total_endpoints > 0 && (
                  <>
                    <div
                      style={{
                        width: `${(dashboard.summary.risk_distribution.LOW / dashboard.summary.total_endpoints) * 100}%`,
                        backgroundColor: 'hsl(var(--success))'
                      }}
                    />
                    <div
                      style={{
                        width: `${(dashboard.summary.risk_distribution.MEDIUM / dashboard.summary.total_endpoints) * 100}%`,
                        backgroundColor: 'hsl(var(--warning))'
                      }}
                    />
                    <div
                      style={{
                        width: `${(dashboard.summary.risk_distribution.HIGH / dashboard.summary.total_endpoints) * 100}%`,
                        backgroundColor: 'hsl(var(--accent-gold))'
                      }}
                    />
                    <div
                      style={{
                        width: `${(dashboard.summary.risk_distribution.CRITICAL / dashboard.summary.total_endpoints) * 100}%`,
                        backgroundColor: 'hsl(var(--danger))'
                      }}
                    />
                  </>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--success))' }} />
                    <span className="text-xs font-medium text-muted-foreground">Low</span>
                  </div>
                  <div className="text-sm font-bold ml-4" style={{ color: 'hsl(var(--foreground))' }}>{dashboard.summary.risk_distribution.LOW}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--warning))' }} />
                    <span className="text-xs font-medium text-muted-foreground">Medium</span>
                  </div>
                  <div className="text-sm font-bold ml-4" style={{ color: 'hsl(var(--foreground))' }}>{dashboard.summary.risk_distribution.MEDIUM}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--accent-gold))' }} />
                    <span className="text-xs font-medium text-muted-foreground">High</span>
                  </div>
                  <div className="text-sm font-bold ml-4" style={{ color: 'hsl(var(--foreground))' }}>{dashboard.summary.risk_distribution.HIGH}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--danger))' }} />
                    <span className="text-xs font-medium text-muted-foreground">Critical</span>
                  </div>
                  <div className="text-sm font-bold ml-4" style={{ color: 'hsl(var(--foreground))' }}>{dashboard.summary.risk_distribution.CRITICAL}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-5" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center justify-between text-xs">
            <p className="text-muted-foreground">
              Maintain a score above <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>80</span> for optimal security resilience
            </p>
            <p className="text-muted-foreground">
              Last updated: <span className="font-medium">Just now</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
