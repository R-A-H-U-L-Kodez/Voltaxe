import React, { useState, useEffect } from 'react';import React, { useState, useEffect } from 'react';

import { Shield, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';import { Shield, TrendingUp, TrendingDown, Minus, Zap, Activity } from 'lucide-react';

import { resilienceService } from '../services/api';import { resilienceService } from '../services/api';

import { ResilienceDashboard } from '../types';import { ResilienceDashboard } from '../types';



interface ResilienceScoreWidgetProps {interface ResilienceScoreWidgetProps {

  className?: string;  className?: string;

}}



export const ResilienceScoreWidget: React.FC<ResilienceScoreWidgetProps> = ({ className }) => {export const ResilienceScoreWidget: React.FC<ResilienceScoreWidgetProps> = ({ className }) => {

  const [dashboard, setDashboard] = useState<ResilienceDashboard | null>(null);  const [dashboard, setDashboard] = useState<ResilienceDashboard | null>(null);

  const [loading, setLoading] = useState(true);  const [loading, setLoading] = useState(true);

  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');



  useEffect(() => {  useEffect(() => {

    const fetchData = async () => {    const fetchData = async () => {

      try {      try {

        setLoading(true);        setLoading(true);

        const data = await resilienceService.getResilienceDashboard();        const data = await resilienceService.getResilienceDashboard();

        setDashboard(data);        setDashboard(data);

                

        // Calculate trend        // Calculate trend (you can enhance this with historical data)

        if (data.summary.average_score > 75) {        if (data.summary.average_score > 75) {

          setTrend('up');          setTrend('up');

        } else if (data.summary.average_score < 50) {        } else if (data.summary.average_score < 50) {

          setTrend('down');          setTrend('down');

        } else {        } else {

          setTrend('stable');          setTrend('stable');

        }        }

      } catch (err) {      } catch (err) {

        console.error('Failed to fetch resilience data:', err);        console.error('Failed to fetch resilience data:', err);

      } finally {      } finally {

        setLoading(false);        setLoading(false);

      }      }

    };    };



    fetchData();    fetchData();

    const interval = setInterval(fetchData, 30000);    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);    return () => clearInterval(interval);

  }, []);  }, []);



  const getScoreColor = (score: number) => {  const getScoreColor = (score: number) => {

    if (score >= 80) return 'hsl(var(--success))';    if (score >= 80) return 'hsl(var(--success))';

    if (score >= 60) return 'hsl(var(--warning))';    if (score >= 60) return 'hsl(var(--warning))';

    if (score >= 40) return 'hsl(var(--accent-gold))';    if (score >= 40) return 'hsl(var(--accent-gold))';

    return 'hsl(var(--danger))';    return 'hsl(var(--danger))';

  };  };



  const getScoreGrade = (score: number) => {  const getScoreGrade = (score: number) => {

    if (score >= 90) return 'A+';    if (score >= 90) return 'A+';

    if (score >= 80) return 'A';    if (score >= 80) return 'A';

    if (score >= 70) return 'B';    if (score >= 70) return 'B';

    if (score >= 60) return 'C';    if (score >= 60) return 'C';

    if (score >= 50) return 'D';    if (score >= 50) return 'D';

    return 'F';    return 'F';

  };  };



  const getScoreDescription = (score: number) => {  const getScoreDescription = (score: number) => {

    if (score >= 80) return 'Excellent Security Posture';    if (score >= 80) return 'Excellent Security Posture';

    if (score >= 60) return 'Good Security Posture';    if (score >= 60) return 'Good Security Posture';

    if (score >= 40) return 'Moderate Risk';    if (score >= 40) return 'Moderate Risk';

    return 'High Risk - Immediate Action Required';    return 'High Risk - Immediate Action Required';

  };  };



  const getTrendIcon = () => {  const getTrendIcon = () => {

    switch (trend) {    switch (trend) {

      case 'up':      case 'up':

        return <TrendingUp className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />;        return <TrendingUp className="h-5 w-5" style={{ color: 'hsl(var(--success))' }} />;

      case 'down':      case 'down':

        return <TrendingDown className="h-4 w-4" style={{ color: 'hsl(var(--danger))' }} />;        return <TrendingDown className="h-5 w-5" style={{ color: 'hsl(var(--danger))' }} />;

      default:      default:

        return <Minus className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />;        return <Minus className="h-5 w-5" style={{ color: 'hsl(var(--muted-foreground))' }} />;

    }    }

  };  };



  if (loading) {  if (loading) {

    return (    return (

      <div className={`card ${className}`}>      <div className={`card ${className}`}>

        <div className="flex items-center justify-center h-64">        <div className="flex items-center justify-center h-64">

          <div className="relative">          <div className="relative">

            <div className="animate-spin rounded-full h-12 w-12 border-4" style={{ borderColor: 'hsl(var(--border))' }}></div>            <div className="animate-spin rounded-full h-16 w-16 border-4 border-border"></div>

            <div             <div 

              className="animate-spin rounded-full h-12 w-12 border-t-4 absolute top-0 left-0"               className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-gold absolute top-0 left-0" 

              style={{ borderTopColor: 'hsl(var(--primary-gold))' }}              style={{ borderTopColor: 'hsl(var(--primary-gold))' }}

            ></div>            ></div>

          </div>          </div>

        </div>        </div>

      </div>      </div>

    );    );

  }  }



  if (!dashboard) {  if (!dashboard) {

    return null;    return null;

  }  }



  const score = dashboard.summary.average_score;  const score = dashboard.summary.average_score;

  const scoreColor = getScoreColor(score);  const scoreColor = getScoreColor(score);

  const circumference = 2 * Math.PI * 90;  const circumference = 2 * Math.PI * 90; // radius = 90

  const strokeDashoffset = circumference - (score / 100) * circumference;  const strokeDashoffset = circumference - (score / 100) * circumference;



  return (  return (

    <div className={`card ${className}`}>    <div className={`relative overflow-hidden rounded-3xl shadow-2xl ${className}`}>

      <div className="p-8">      {/* Dark background with subtle gold accents */}

        {/* Header */}      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>

        <div className="flex items-start justify-between mb-8">      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-500/5 to-transparent"></div>

          <div className="flex items-center gap-3">      

            <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)' }}>      {/* Subtle animated orbs */}

              <Shield className="h-6 w-6" style={{ color: 'hsl(var(--primary-gold))' }} />      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-yellow-500 opacity-5 rounded-full blur-3xl animate-pulse"></div>

            </div>      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-56 h-56 bg-orange-500 opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>

            <div>      

              <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>      {/* Subtle grid pattern overlay */}

                Organization Resilience Score      <div className="absolute inset-0 opacity-5" style={{ 

              </h2>        backgroundImage: 'linear-gradient(rgba(255,215,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,.1) 1px, transparent 1px)',

              <p className="text-sm text-muted-foreground mt-1">        backgroundSize: '50px 50px'

                Real-time AI Analysis • Powered by Axon Engine      }}></div>

              </p>      

            </div>      {/* Gold border glow */}

          </div>      <div className="absolute inset-0 rounded-3xl border border-yellow-500/20 shadow-inner"></div>

                

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>      {/* Content */}

            {getTrendIcon()}      <div className="relative z-10 p-8 md:p-10">

            <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>        <div className="flex items-start justify-between mb-8">

              {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}          <div>

            </span>            <div className="flex items-center gap-3 mb-3">

          </div>              <div className="p-3 bg-gray-800/50 rounded-xl backdrop-blur-sm shadow-lg transform hover:scale-110 transition-transform duration-300">

        </div>                <Shield className="h-7 w-7 text-yellow-500" />

              </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">              <div>

          {/* Circular Score Visualization */}                <h2 className="text-3xl md:text-4xl font-bold text-gradient-gold drop-shadow-lg">

          <div className="flex flex-col items-center justify-center">                  Organization Resilience Score

            <div className="relative w-48 h-48">                </h2>

              <svg className="w-full h-full transform -rotate-90">                <p className="text-gray-200/90 text-sm flex items-center gap-2 mt-1">

                <defs>                  <Zap className="h-4 w-4 animate-pulse" />

                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">                  Real-time AI Analysis • Powered by Axon Engine

                    <stop offset="0%" style={{ stopColor: scoreColor }} />                </p>

                    <stop offset="100%" style={{ stopColor: scoreColor, stopOpacity: 0.7 }} />              </div>

                  </linearGradient>            </div>

                </defs>          </div>

                          

                {/* Background circle */}          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 rounded-xl backdrop-blur-sm shadow-lg border border-yellow-500/20">

                <circle            {getTrendIcon()}

                  cx="96"            <span className="text-gray-200 text-sm font-semibold">

                  cy="96"              {trend === 'up' ? '↗ Improving' : trend === 'down' ? '↘ Declining' : '→ Stable'}

                  r="90"            </span>

                  stroke="hsl(var(--muted))"          </div>

                  strokeWidth="12"        </div>

                  fill="none"

                />        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Score circle */}          {/* Circular Score Visualization - Enhanced */}

                <circle          <div className="flex flex-col items-center justify-center">

                  cx="96"            <div className="relative w-64 h-64 transform hover:scale-105 transition-transform duration-500">

                  cy="96"              {/* Outer glow ring */}

                  r="90"              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200/30 to-orange-300/30 blur-2xl animate-pulse"></div>

                  stroke="url(#scoreGradient)"              

                  strokeWidth="12"              {/* SVG Circle */}

                  fill="none"              <svg className="w-full h-full transform -rotate-90 relative z-10">

                  strokeDasharray={circumference}                {/* Background circle with gradient */}

                  strokeDashoffset={strokeDashoffset}                <defs>

                  strokeLinecap="round"                  <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">

                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}                    <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.15)' }} />

                />                    <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.25)' }} />

              </svg>                  </linearGradient>

                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">

              {/* Score display */}                    <stop offset="0%" style={{ stopColor: scoreColor, stopOpacity: 1 }} />

              <div className="absolute inset-0 flex flex-col items-center justify-center">                    <stop offset="100%" style={{ stopColor: scoreColor, stopOpacity: 0.8 }} />

                <div className="text-5xl font-bold" style={{ color: scoreColor }}>                  </linearGradient>

                  {Math.round(score)}                  <filter id="glow">

                </div>                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>

                <div className="text-lg font-semibold text-muted-foreground">                    <feMerge>

                  {getScoreGrade(score)}                      <feMergeNode in="coloredBlur"/>

                </div>                      <feMergeNode in="SourceGraphic"/>

                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">                    </feMerge>

                  out of 100                  </filter>

                </div>                </defs>

              </div>                

            </div>                <circle

          </div>                  cx="128"

                  cy="128"

          {/* Score Details */}                  r="90"

          <div className="lg:col-span-2 flex flex-col justify-between space-y-6">                  stroke="url(#bgGradient)"

            {/* Status Description */}                  strokeWidth="14"

            <div className="rounded-lg p-5" style={{ backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>                  fill="none"

              <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">                />

                Security Posture Status                {/* Score circle with animation and glow */}

              </h3>                <circle

              <p className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>                  cx="128"

                {getScoreDescription(score)}                  cy="128"

              </p>                  r="90"

              {score < 60 && (                  stroke="url(#scoreGradient)"

                <div className="flex items-start gap-2 mt-3 p-3 rounded-md" style={{ backgroundColor: 'hsl(var(--danger) / 0.1)' }}>                  strokeWidth="14"

                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--danger))' }} />                  fill="none"

                  <p className="text-sm" style={{ color: 'hsl(var(--danger))' }}>                  strokeDasharray={circumference}

                    Review high-risk endpoints and take corrective action                  strokeDashoffset={strokeDashoffset}

                  </p>                  strokeLinecap="round"

                </div>                  filter="url(#glow)"

              )}                  className="transition-all duration-1000 ease-out"

            </div>                />

              </svg>

            {/* Quick Stats Grid */}              

            <div className="grid grid-cols-2 gap-4">              {/* Score display in center with enhanced styling */}

              <div className="rounded-lg p-5" style={{ backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>              <div className="absolute inset-0 flex flex-col items-center justify-center">

                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">                <div className="text-8xl font-black text-gradient-gold mb-2 drop-shadow-2xl animate-fadeIn">

                  Endpoints Monitored                  {Math.round(score)}

                </p>                </div>

                <p className="text-3xl font-bold" style={{ color: 'hsl(var(--primary-gold))' }}>                <div className="text-3xl font-bold text-gray-200/95 mb-1 drop-shadow-lg">

                  {dashboard.summary.total_endpoints}                  {getScoreGrade(score)}

                </p>                </div>

              </div>                <div className="text-xs font-medium text-gray-200/75 uppercase tracking-wider">

                                out of 100

              <div className="rounded-lg p-5" style={{ backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>                </div>

                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">              </div>

                  High Risk Systems            </div>

                </p>          </div>

                <p className="text-3xl font-bold" style={{ color: 'hsl(var(--danger))' }}>

                  {dashboard.summary.risk_distribution.HIGH + dashboard.summary.risk_distribution.CRITICAL}          {/* Score Details - Enhanced */}

                </p>          <div className="lg:col-span-2 flex flex-col justify-between space-y-5">

              </div>            {/* Status Description with icon */}

            </div>            <div className="glass rounded-2xl p-5 border border-yellow-500/20 backdrop-blur-md shadow-xl transform hover:scale-[1.02] transition-all duration-300">

              <div className="flex items-start gap-3">

            {/* Risk Distribution */}                <div className="p-2 bg-yellow-500/10 rounded-lg mt-1">

            <div className="rounded-lg p-5" style={{ backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>                  <Activity className="h-6 w-6 text-gray-200" />

              <div className="flex items-center justify-between mb-4">                </div>

                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">                <div className="flex-1">

                  Risk Distribution                  <h3 className="text-gray-200 font-bold text-lg mb-2">

                </p>                    Security Posture Status

                <p className="text-xs text-muted-foreground">                  </h3>

                  {dashboard.summary.total_endpoints} Total                  <p className="text-gray-200/95 text-xl font-semibold">

                </p>                    {getScoreDescription(score)}

              </div>                  </p>

                                {score < 60 && (

              <div className="flex h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--background))' }}>                    <p className="text-gray-200/80 text-sm mt-2 italic">

                {dashboard.summary.total_endpoints > 0 && (                      ⚠️ Review high-risk endpoints and take corrective action

                  <>                    </p>

                    <div                   )}

                      style={{                   {score >= 80 && (

                        width: `${(dashboard.summary.risk_distribution.LOW / dashboard.summary.total_endpoints) * 100}%`,                    <p className="text-gray-200/80 text-sm mt-2 flex items-center gap-1">

                        backgroundColor: 'hsl(var(--success))'                      <span className="text-xl">🎉</span> Outstanding! Keep up the excellent work

                      }}                    </p>

                      title={`Low: ${dashboard.summary.risk_distribution.LOW}`}                  )}

                    />                </div>

                    <div               </div>

                      style={{             </div>

                        width: `${(dashboard.summary.risk_distribution.MEDIUM / dashboard.summary.total_endpoints) * 100}%`,

                        backgroundColor: 'hsl(var(--warning))'            {/* Quick Stats Grid - Enhanced */}

                      }}            <div className="grid grid-cols-2 gap-4">

                      title={`Medium: ${dashboard.summary.risk_distribution.MEDIUM}`}              <div className="glass rounded-2xl p-5 border border-yellow-500/20 backdrop-blur-md shadow-xl transform hover:scale-[1.05] hover:shadow-2xl transition-all duration-300 group">

                    />                <div className="flex items-center justify-between">

                    <div                   <div>

                      style={{                     <p className="text-gray-200/85 text-xs font-medium uppercase tracking-wide mb-2">

                        width: `${(dashboard.summary.risk_distribution.HIGH / dashboard.summary.total_endpoints) * 100}%`,                      Endpoints Monitored

                        backgroundColor: 'hsl(var(--accent-gold))'                    </p>

                      }}                    <p className="text-5xl font-black text-gradient-gold drop-shadow-lg group-hover:scale-110 transition-transform">

                      title={`High: ${dashboard.summary.risk_distribution.HIGH}`}                      {dashboard.summary.total_endpoints}

                    />                    </p>

                    <div                   </div>

                      style={{                   <div className="p-3 bg-yellow-500/10 rounded-xl">

                        width: `${(dashboard.summary.risk_distribution.CRITICAL / dashboard.summary.total_endpoints) * 100}%`,                    <Activity className="h-8 w-8 text-gray-200/80" />

                        backgroundColor: 'hsl(var(--danger))'                  </div>

                      }}                </div>

                      title={`Critical: ${dashboard.summary.risk_distribution.CRITICAL}`}              </div>

                    />              

                  </>              <div className="glass rounded-2xl p-5 border border-yellow-500/20 backdrop-blur-md shadow-xl transform hover:scale-[1.05] hover:shadow-2xl transition-all duration-300 group">

                )}                <div className="flex items-center justify-between">

              </div>                  <div>

                                  <p className="text-gray-200/85 text-xs font-medium uppercase tracking-wide mb-2">

              <div className="grid grid-cols-4 gap-3 mt-4">                      High Risk Systems

                <div>                    </p>

                  <div className="flex items-center gap-2 mb-1">                    <p className="text-5xl font-black text-gradient-gold drop-shadow-lg group-hover:scale-110 transition-transform">

                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--success))' }}></div>                      {dashboard.summary.risk_distribution.HIGH + dashboard.summary.risk_distribution.CRITICAL}

                    <span className="text-xs font-medium text-muted-foreground">Low</span>                    </p>

                  </div>                  </div>

                  <div className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{dashboard.summary.risk_distribution.LOW}</div>                  <div className="p-3 bg-yellow-500/10 rounded-xl">

                </div>                    <Shield className="h-8 w-8 text-gray-200/80" />

                <div>                  </div>

                  <div className="flex items-center gap-2 mb-1">                </div>

                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--warning))' }}></div>              </div>

                    <span className="text-xs font-medium text-muted-foreground">Medium</span>            </div>

                  </div>

                  <div className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{dashboard.summary.risk_distribution.MEDIUM}</div>            {/* Risk Distribution Bar - Enhanced */}

                </div>            <div className="glass rounded-2xl p-5 border border-yellow-500/20 backdrop-blur-md shadow-xl">

                <div>              <div className="flex items-center justify-between mb-4">

                  <div className="flex items-center gap-2 mb-1">                <p className="text-gray-200/90 font-semibold text-sm uppercase tracking-wide">

                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--accent-gold))' }}></div>                  Risk Distribution

                    <span className="text-xs font-medium text-muted-foreground">High</span>                </p>

                  </div>                <p className="text-gray-200/80 text-xs font-medium">

                  <div className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{dashboard.summary.risk_distribution.HIGH}</div>                  {dashboard.summary.total_endpoints} Total

                </div>                </p>

                <div>              </div>

                  <div className="flex items-center gap-2 mb-1">              

                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--danger))' }}></div>              <div className="relative">

                    <span className="text-xs font-medium text-muted-foreground">Critical</span>                <div className="flex h-4 rounded-full overflow-hidden bg-gray-900/50 shadow-inner border border-yellow-500/20">

                  </div>                  {dashboard.summary.total_endpoints > 0 && (

                  <div className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{dashboard.summary.risk_distribution.CRITICAL}</div>                    <>

                </div>                      <div 

              </div>                        className="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-700 hover:brightness-110 relative group"

            </div>                        style={{ 

          </div>                          width: `${(dashboard.summary.risk_distribution.LOW / dashboard.summary.total_endpoints) * 100}%` 

        </div>                        }}

                        title={`Low: ${dashboard.summary.risk_distribution.LOW}`}

        {/* Footer */}                      >

        <div className="mt-6 pt-6" style={{ borderTop: '1px solid hsl(var(--border))' }}>                        <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

          <div className="flex items-center justify-between text-sm">                      </div>

            <p className="text-muted-foreground">                      <div 

              Maintain a score above <span className="font-bold" style={{ color: 'hsl(var(--foreground))' }}>80</span> for optimal security resilience                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-700 hover:brightness-110 relative group"

            </p>                        style={{ 

            <p className="text-muted-foreground">                          width: `${(dashboard.summary.risk_distribution.MEDIUM / dashboard.summary.total_endpoints) * 100}%` 

              Last updated: <span className="font-medium">Just now</span>                        }}

            </p>                        title={`Medium: ${dashboard.summary.risk_distribution.MEDIUM}`}

          </div>                      >

        </div>                        <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

      </div>                      </div>

    </div>                      <div 

  );                        className="bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-700 hover:brightness-110 relative group"

};                        style={{ 

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
