import React, { useState, useEffect } from 'react';
import { resilienceService } from '../services/api';
import { ResilienceScore, ResilienceDashboard } from '../types';
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Clock, Activity, Zap } from 'lucide-react';
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
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchResilienceData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRiskIcon = (risk: string | null) => {
    switch (risk?.toUpperCase()) {
      case 'LOW': return <CheckCircle className="h-5 w-5" />;
      case 'MEDIUM': return <Clock className="h-5 w-5" />;
      case 'HIGH': return <AlertTriangle className="h-5 w-5" />;
      case 'CRITICAL': return <AlertTriangle className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className={`card animate-fadeIn ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-border"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-gold absolute top-0 left-0" style={{ borderTopColor: 'hsl(var(--primary-gold))' }}></div>
          </div>
          <span className="ml-4 text-lg text-foreground">Loading resilience intelligence...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card animate-fadeIn ${className}`}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'hsl(var(--danger) / 0.2)' }}>
            <AlertTriangle className="h-8 w-8" style={{ color: 'hsl(var(--danger))' }} />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{error}</h3>
          <p className="text-sm text-muted-foreground">Ensure the Axon Engine is running and connected</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 animate-fadeIn ${className}`}>
      {/* Hero Header */}
      <div className="relative overflow-hidden gradient-gold rounded-2xl shadow-2xl glow-gold p-8">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-black bg-opacity-20 rounded-xl backdrop-blur-sm">
              <Shield className="h-10 w-10 text-background" />
            </div>
            <div className="ml-4">
              <h2 className="text-3xl font-bold text-background">Resilience Intelligence</h2>
              <p className="text-background/80 flex items-center mt-1">
                <Zap className="h-4 w-4 mr-1" />
                Powered by Voltaxe Axon Engine
              </p>
            </div>
          </div>
          
          {dashboard && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="glass rounded-xl p-4 border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-background/80 text-sm font-medium">Average Score</p>
                    <p className="text-4xl font-bold text-background mt-1">{dashboard.summary.average_score}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-background/60" />
                </div>
              </div>
              
              <div className="glass rounded-xl p-4 border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-background/80 text-sm font-medium">Endpoints</p>
                    <p className="text-4xl font-bold text-background mt-1">{dashboard.summary.total_endpoints}</p>
                  </div>
                  <Activity className="h-8 w-8 text-background/60" />
                </div>
              </div>
              
              <div className="glass rounded-xl p-4 border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-background/80 text-sm font-medium">At Risk</p>
                    <p className="text-4xl font-bold text-background mt-1">
                      {dashboard.summary.risk_distribution.HIGH + dashboard.summary.risk_distribution.CRITICAL}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-background/60" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Risk Distribution Cards */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(dashboard.summary.risk_distribution).map(([risk, count]) => {
            const colors = getRiskColor(risk);
            return (
              <div 
                key={risk} 
                className="card card-hover border-l-4"
                style={{ borderLeftColor: colors.icon }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{risk}</p>
                    <p className="text-3xl font-bold mt-2" style={{ color: colors.icon }}>{count}</p>
                  </div>
                  <div 
                    className="p-3 rounded-full" 
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
        <div className="px-6 py-5 border-b" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
          <h3 className="text-xl font-bold text-foreground">Endpoint Resilience Scores</h3>
          <p className="text-sm text-muted-foreground mt-1">Real-time security posture assessment</p>
        </div>
        
        <div className="p-6">
          {scores.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                <Shield className="h-10 w-10 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">No Resilience Scores Available</h4>
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
                    className="rounded-xl p-6 border transition-smooth hover:border-primary-gold hover:glow-gold"
                    style={{ 
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))'
                    }}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      {/* Hostname */}
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center shadow-lg">
                            <Shield className="h-7 w-7" style={{ color: 'hsl(var(--background))' }} />
                          </div>
                        </div>
                        <div className="ml-4 min-w-0">
                          <h4 className="text-lg font-semibold text-foreground truncate">{score.hostname}</h4>
                          <p className="text-sm text-muted-foreground">
                            Last scored: {score.last_scored ? new Date(score.last_scored).toLocaleString() : 'Never'}
                          </p>
                        </div>
                      </div>

                      {/* Score Display */}
                      <div className="flex items-center gap-6">
                        {/* Resilience Score */}
                        <div className="text-center">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Score</p>
                          <div className="relative">
                            <div className="text-4xl font-bold text-gradient-gold">
                              {scoreValue}
                            </div>
                            <div className="text-sm text-muted-foreground absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                              /100
                            </div>
                          </div>
                        </div>

                        {/* Risk Badge */}
                        <div className="text-center">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Risk</p>
                          <span 
                            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold"
                            style={{ 
                              backgroundColor: colors.bg,
                              color: colors.text,
                              borderWidth: '1px',
                              borderStyle: 'solid',
                              borderColor: colors.border
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
                          <p className="text-sm font-medium text-muted-foreground mb-1">Vulnerabilities</p>
                          <div className="flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 mr-2" style={{ color: 'hsl(var(--warning))' }} />
                            <span className="text-2xl font-bold text-foreground">
                              {score.vulnerability_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full rounded-full h-3 overflow-hidden" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${scoreValue}%`,
                            background: scoreValue >= 90 
                              ? 'linear-gradient(to right, hsl(var(--success)), hsl(142 76% 45%))'
                              : scoreValue >= 75
                              ? 'linear-gradient(to right, hsl(var(--primary-gold)), hsl(var(--accent-gold)))'
                              : scoreValue >= 50
                              ? 'linear-gradient(to right, hsl(var(--warning)), hsl(38 92% 60%))'
                              : 'linear-gradient(to right, hsl(var(--danger)), hsl(0 84% 70%))'
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

export default ResilienceDashboardComponent;