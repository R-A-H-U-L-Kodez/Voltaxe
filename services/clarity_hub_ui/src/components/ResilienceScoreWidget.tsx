import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, TrendingDown, Minus, Zap, Activity } from 'lucide-react';
import { resilienceService } from '../services/api';
import { ResilienceDashboard } from '../types';

interface ResilienceScoreWidgetProps {
  className?: string;
}

export const ResilienceScoreWidget: React.FC<ResilienceScoreWidgetProps> = ({ className }) => {
  const [dashboard, setDashboard] = useState<ResilienceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await resilienceService.getResilienceDashboard();
        setDashboard(data);
        
        // Calculate trend (you can enhance this with historical data)
        if (data.summary.average_score > 75) {
          setTrend('up');
        } else if (data.summary.average_score < 50) {
          setTrend('down');
        } else {
          setTrend('stable');
        }
      } catch (err) {
        console.error('Failed to fetch resilience data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
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
    if (score >= 80) return 'Excellent Security Posture';
    if (score >= 60) return 'Good Security Posture';
    if (score >= 40) return 'Moderate Risk';
    return 'High Risk - Immediate Action Required';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-5 w-5" style={{ color: 'hsl(var(--success))' }} />;
      case 'down':
        return <TrendingDown className="h-5 w-5" style={{ color: 'hsl(var(--danger))' }} />;
      default:
        return <Minus className="h-5 w-5" style={{ color: 'hsl(var(--muted-foreground))' }} />;
    }
  };

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-border"></div>
            <div 
              className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-gold absolute top-0 left-0" 
              style={{ borderTopColor: 'hsl(var(--primary-gold))' }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const score = dashboard.summary.average_score;
  const scoreColor = getScoreColor(score);
  const circumference = 2 * Math.PI * 90; // radius = 90
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative overflow-hidden rounded-3xl shadow-2xl ${className}`}>
      {/* Dark background with subtle gold accents */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-500/5 to-transparent"></div>
      
      {/* Subtle animated orbs */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-yellow-500 opacity-5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-56 h-56 bg-orange-500 opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{ 
        backgroundImage: 'linear-gradient(rgba(255,215,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>
      
      {/* Gold border glow */}
      <div className="absolute inset-0 rounded-3xl border border-yellow-500/20 shadow-inner"></div>
      
      {/* Content */}
      <div className="relative z-10 p-8 md:p-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gray-800/50 rounded-xl backdrop-blur-sm shadow-lg transform hover:scale-110 transition-transform duration-300">
                <Shield className="h-7 w-7 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gradient-gold drop-shadow-lg">
                  Organization Resilience Score
                </h2>
                <p className="text-gray-200/90 text-sm flex items-center gap-2 mt-1">
                  <Zap className="h-4 w-4 animate-pulse" />
                  Real-time AI Analysis • Powered by Axon Engine
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 rounded-xl backdrop-blur-sm shadow-lg border border-yellow-500/20">
            {getTrendIcon()}
            <span className="text-gray-200 text-sm font-semibold">
              {trend === 'up' ? '↗ Improving' : trend === 'down' ? '↘ Declining' : '→ Stable'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Circular Score Visualization - Enhanced */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 transform hover:scale-105 transition-transform duration-500">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200/30 to-orange-300/30 blur-2xl animate-pulse"></div>
              
              {/* SVG Circle */}
              <svg className="w-full h-full transform -rotate-90 relative z-10">
                {/* Background circle with gradient */}
                <defs>
                  <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.15)' }} />
                    <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.25)' }} />
                  </linearGradient>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: scoreColor, stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: scoreColor, stopOpacity: 0.8 }} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <circle
                  cx="128"
                  cy="128"
                  r="90"
                  stroke="url(#bgGradient)"
                  strokeWidth="14"
                  fill="none"
                />
                {/* Score circle with animation and glow */}
                <circle
                  cx="128"
                  cy="128"
                  r="90"
                  stroke="url(#scoreGradient)"
                  strokeWidth="14"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  filter="url(#glow)"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              
              {/* Score display in center with enhanced styling */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-8xl font-black text-gradient-gold mb-2 drop-shadow-2xl animate-fadeIn">
                  {Math.round(score)}
                </div>
                <div className="text-3xl font-bold text-gray-200/95 mb-1 drop-shadow-lg">
                  {getScoreGrade(score)}
                </div>
                <div className="text-xs font-medium text-gray-200/75 uppercase tracking-wider">
                  out of 100
                </div>
              </div>
            </div>
          </div>

          {/* Score Details - Enhanced */}
          <div className="lg:col-span-2 flex flex-col justify-between space-y-5">
            {/* Status Description with icon */}
            <div className="glass rounded-2xl p-5 border border-yellow-500/20 backdrop-blur-md shadow-xl transform hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg mt-1">
                  <Activity className="h-6 w-6 text-gray-200" />
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-200 font-bold text-lg mb-2">
                    Security Posture Status
                  </h3>
                  <p className="text-gray-200/95 text-xl font-semibold">
                    {getScoreDescription(score)}
                  </p>
                  {score < 60 && (
                    <p className="text-gray-200/80 text-sm mt-2 italic">
                      ⚠️ Review high-risk endpoints and take corrective action
                    </p>
                  )}
                  {score >= 80 && (
                    <p className="text-gray-200/80 text-sm mt-2 flex items-center gap-1">
                      <span className="text-xl">🎉</span> Outstanding! Keep up the excellent work
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Grid - Enhanced */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-2xl p-5 border border-yellow-500/20 backdrop-blur-md shadow-xl transform hover:scale-[1.05] hover:shadow-2xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-200/85 text-xs font-medium uppercase tracking-wide mb-2">
                      Endpoints Monitored
                    </p>
                    <p className="text-5xl font-black text-gradient-gold drop-shadow-lg group-hover:scale-110 transition-transform">
                      {dashboard.summary.total_endpoints}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-xl">
                    <Activity className="h-8 w-8 text-gray-200/80" />
                  </div>
                </div>
              </div>
              
              <div className="glass rounded-2xl p-5 border border-yellow-500/20 backdrop-blur-md shadow-xl transform hover:scale-[1.05] hover:shadow-2xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-200/85 text-xs font-medium uppercase tracking-wide mb-2">
                      High Risk Systems
                    </p>
                    <p className="text-5xl font-black text-gradient-gold drop-shadow-lg group-hover:scale-110 transition-transform">
                      {dashboard.summary.risk_distribution.HIGH + dashboard.summary.risk_distribution.CRITICAL}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-xl">
                    <Shield className="h-8 w-8 text-gray-200/80" />
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Distribution Bar - Enhanced */}
            <div className="glass rounded-2xl p-5 border border-yellow-500/20 backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-200/90 font-semibold text-sm uppercase tracking-wide">
                  Risk Distribution
                </p>
                <p className="text-gray-200/80 text-xs font-medium">
                  {dashboard.summary.total_endpoints} Total
                </p>
              </div>
              
              <div className="relative">
                <div className="flex h-4 rounded-full overflow-hidden bg-gray-900/50 shadow-inner border border-yellow-500/20">
                  {dashboard.summary.total_endpoints > 0 && (
                    <>
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-700 hover:brightness-110 relative group"
                        style={{ 
                          width: `${(dashboard.summary.risk_distribution.LOW / dashboard.summary.total_endpoints) * 100}%` 
                        }}
                        title={`Low: ${dashboard.summary.risk_distribution.LOW}`}
                      >
                        <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-700 hover:brightness-110 relative group"
                        style={{ 
                          width: `${(dashboard.summary.risk_distribution.MEDIUM / dashboard.summary.total_endpoints) * 100}%` 
                        }}
                        title={`Medium: ${dashboard.summary.risk_distribution.MEDIUM}`}
                      >
                        <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <div 
                        className="bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-700 hover:brightness-110 relative group"
                        style={{ 
                          width: `${(dashboard.summary.risk_distribution.HIGH / dashboard.summary.total_endpoints) * 100}%` 
                        }}
                        title={`High: ${dashboard.summary.risk_distribution.HIGH}`}
                      >
                        <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <div 
                        className="bg-gradient-to-r from-red-500 to-red-700 transition-all duration-700 hover:brightness-110 relative group"
                        style={{ 
                          width: `${(dashboard.summary.risk_distribution.CRITICAL / dashboard.summary.total_endpoints) * 100}%` 
                        }}
                        title={`Critical: ${dashboard.summary.risk_distribution.CRITICAL}`}
                      >
                        <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mt-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-gray-200/80 text-xs font-medium">Low</span>
                  </div>
                  <div className="text-gray-200 text-sm font-bold">{dashboard.summary.risk_distribution.LOW}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-gray-200/80 text-xs font-medium">Medium</span>
                  </div>
                  <div className="text-gray-200 text-sm font-bold">{dashboard.summary.risk_distribution.MEDIUM}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-gray-200/80 text-xs font-medium">High</span>
                  </div>
                  <div className="text-gray-200 text-sm font-bold">{dashboard.summary.risk_distribution.HIGH}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="w-2 h-2 rounded-full bg-red-600"></div>
                    <span className="text-gray-200/80 text-xs font-medium">Critical</span>
                  </div>
                  <div className="text-gray-200 text-sm font-bold">{dashboard.summary.risk_distribution.CRITICAL}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action footer with enhanced styling */}
        <div className="mt-8 pt-6 border-t border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <p className="text-gray-200/90 text-sm font-medium">
                Maintain a score above <span className="font-bold text-gray-200">80</span> for optimal security resilience
              </p>
            </div>
            <div className="px-4 py-2 bg-yellow-500/10 rounded-lg backdrop-blur-sm border border-yellow-500/20">
              <p className="text-gray-200/80 text-xs font-medium">
                Last updated: <span className="font-semibold">Just now</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
