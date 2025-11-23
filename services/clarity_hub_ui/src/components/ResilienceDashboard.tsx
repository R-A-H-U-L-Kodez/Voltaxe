import React, { useState, useEffect } from 'react';
import { resilienceService } from '../services/api';
import { ResilienceScore, ResilienceDashboard } from '../types';
import { Shield, AlertTriangle, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { getRiskColor } from '../theme';

interface ResilienceDashboardComponentProps {
  className?: string;
}

export const ResilienceDashboardComponent: React.FC<ResilienceDashboardComponentProps> = ({ className }) => {
  const [dashboard, setDashboard] = useState<ResilienceDashboard | null>(null);
  const [scores, setScores] = useState<ResilienceScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResilienceData = async () => {
      try {
        setLoading(true);
        const [dashboardData, scoresData] = await Promise.all([
          resilienceService.getResilienceDashboard(),
          resilienceService.getResilienceScores()
        ]);
        
        setDashboard(dashboardData);
        setScores(scoresData);
        setError('');
      } catch (err) {
        setError('Failed to fetch resilience data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResilienceData();
    const interval = setInterval(fetchResilienceData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRiskIcon = (risk: string | null) => {
    switch (risk?.toUpperCase()) {
      case 'LOW': return <CheckCircle className="h-5 w-5" />;
      case 'MEDIUM': return <AlertCircle className="h-5 w-5" />;
      case 'HIGH': return <AlertTriangle className="h-5 w-5" />;
      case 'CRITICAL': return <AlertTriangle className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4" style={{ borderColor: 'hsl(var(--border))' }}></div>
            <div 
              className="animate-spin rounded-full h-12 w-12 border-t-4 absolute top-0 left-0" 
              style={{ borderTopColor: 'hsl(var(--primary-gold))' }}
            ></div>
          </div>
          <span className="ml-4 text-lg" style={{ color: 'hsl(var(--foreground))' }}>Loading resilience intelligence...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card ${className}`}>
        <div className="text-center p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'hsl(var(--danger) / 0.1)' }}>
            <AlertTriangle className="h-8 w-8" style={{ color: 'hsl(var(--danger))' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>{error}</h3>
          <p className="text-sm text-muted-foreground">Ensure the Axon Engine is running and connected</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Risk Distribution Cards */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(dashboard.summary.risk_distribution).map(([risk, count]) => {
            const colors = getRiskColor(risk);
            return (
              <div 
                key={risk} 
                className="card border-l-4"
                style={{ borderLeftColor: colors.icon }}
              >
                <div className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{risk}</p>
                    <p className="text-3xl font-bold mt-2" style={{ color: colors.icon }}>{count}</p>
                  </div>
                  <div 
                    className="p-3 rounded-lg" 
                    style={{ backgroundColor: colors.bg }}
                  >
                    <span style={{ color: colors.icon }}>
                      {getRiskIcon(risk)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Endpoint Resilience Scores Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <span>Endpoint Resilience Scores</span>
              <Plus className="h-5 w-5" style={{ color: 'hsl(var(--primary-gold))' }} />
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Real-time security posture assessment</p>
          </div>
        </div>
        
        <div className="p-6">
          {scores.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                <Shield className="h-10 w-10 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>No Resilience Scores Available</h4>
              <p className="text-muted-foreground">Scores will appear once the Axon Engine processes endpoint data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scores.map((score) => {
                const colors = getRiskColor(score.risk_category);
                const scoreValue = score.resilience_score ?? 0;
                
                return (
                  <div 
                    key={score.hostname} 
                    className="rounded-lg p-6"
                    style={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))'
                    }}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      {/* Hostname */}
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center" 
                            style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)' }}
                          >
                            <Shield className="h-6 w-6" style={{ color: 'hsl(var(--primary-gold))' }} />
                          </div>
                        </div>
                        <div className="ml-4 min-w-0">
                          <h4 className="text-lg font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{score.hostname}</h4>
                          <p className="text-sm text-muted-foreground">
                            Last scored: {score.last_scored ? new Date(score.last_scored).toLocaleString() : 'Never'}
                          </p>
                        </div>
                      </div>

                      {/* Score Display */}
                      <div className="flex items-center gap-6">
                        {/* Resilience Score */}
                        <div className="text-center">
                          <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Score</p>
                          <div className="text-3xl font-bold" style={{ color: 'hsl(var(--primary-gold))' }}>
                            {scoreValue}
                            <span className="text-sm text-muted-foreground">/100</span>
                          </div>
                        </div>

                        {/* Risk Badge */}
                        <div className="text-center">
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Risk</p>
                          <span 
                            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold"
                            style={{ 
                              backgroundColor: colors.bg,
                              color: colors.text,
                              border: `1px solid ${colors.border}`
                            }}
                          >
                            <span style={{ color: colors.icon }}>
                              {getRiskIcon(score.risk_category)}
                            </span>
                            <span className="ml-2">{score.risk_category || 'Unknown'}</span>
                          </span>
                        </div>

                        {/* Vulnerabilities */}
                        <div className="text-center">
                          <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Vulnerabilities</p>
                          <div className="flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 mr-2" style={{ color: 'hsl(var(--warning))' }} />
                            <span className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                              {score.vulnerability_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${scoreValue}%`,
                            backgroundColor: scoreValue >= 80 
                              ? 'hsl(var(--success))'
                              : scoreValue >= 60
                              ? 'hsl(var(--warning))'
                              : scoreValue >= 40
                              ? 'hsl(var(--accent-gold))'
                              : 'hsl(var(--danger))',
                            transition: 'width 0.5s ease-out'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
