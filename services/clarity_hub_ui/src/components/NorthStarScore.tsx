import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Shield, Target } from 'lucide-react';

interface NorthStarScoreProps {
  score: number;
  previousScore?: number;
  loading?: boolean;
}

export const NorthStarScore: React.FC<NorthStarScoreProps> = ({ 
  score, 
  previousScore = 0,
  loading = false 
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  // Animate score on mount/change
  useEffect(() => {
    if (loading) return;
    
    let start = animatedScore;
    const end = Math.round(score);
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(start + (end - start) * easeOutQuart);
      
      setAnimatedScore(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [score, loading]);

  // Determine risk level and colors
  const getRiskLevel = () => {
    if (animatedScore >= 80) return { level: 'Low Risk', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', status: 'Secure' };
    if (animatedScore >= 60) return { level: 'Medium Risk', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', status: 'Needs Attention' };
    if (animatedScore >= 40) return { level: 'High Risk', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', status: 'Dangerous' };
    return { level: 'Critical Risk', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', status: 'Breach Likely' };
  };

  const risk = getRiskLevel();
  const scoreDiff = score - previousScore;
  const hasPositiveTrend = scoreDiff > 0;
  const hasNegativeTrend = scoreDiff < 0;

  // SVG circle calculations
  const size = 280;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div 
      className="rounded-2xl p-8 border-2 relative overflow-hidden transition-all duration-500"
      style={{ 
        backgroundColor: 'hsl(var(--card))',
        borderColor: risk.color,
        boxShadow: `0 0 40px ${risk.color}40`
      }}
    >
      {/* Background gradient effect */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${risk.color}, transparent 70%)`
        }}
      />

      {/* Header */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            North Star Score
          </h2>
          <div className="flex items-center gap-2">
            <Shield size={24} style={{ color: risk.color }} />
          </div>
        </div>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Your organization's unified resilience metric
        </p>
      </div>

      {/* Main Score Gauge */}
      <div className="relative z-10 flex flex-col items-center justify-center mb-6">
        {loading ? (
          <div className="w-[280px] h-[280px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2" style={{ borderColor: 'hsl(var(--primary-gold))' }} />
          </div>
        ) : (
          <div className="relative">
            {/* SVG Circular Progress */}
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth={strokeWidth}
              />
              {/* Progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={risk.color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: `drop-shadow(0 0 8px ${risk.color})`
                }}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-center">
                <div className="text-7xl font-bold mb-2" style={{ color: risk.color }}>
                  {animatedScore}
                </div>
                <div className="text-xl font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                  {risk.level}
                </div>
                <div className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {risk.status}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trend Indicator */}
      {!loading && scoreDiff !== 0 && (
        <div 
          className="relative z-10 flex items-center justify-center gap-2 p-3 rounded-lg"
          style={{ 
            backgroundColor: hasPositiveTrend ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
          }}
        >
          {hasPositiveTrend && <TrendingUp size={20} className="text-green-500" />}
          {hasNegativeTrend && <TrendingDown size={20} className="text-red-500" />}
          {!hasPositiveTrend && !hasNegativeTrend && <Minus size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />}
          
          <span 
            className="font-semibold"
            style={{ 
              color: hasPositiveTrend ? '#10b981' : hasNegativeTrend ? '#ef4444' : 'hsl(var(--muted-foreground))'
            }}
          >
            {hasPositiveTrend && '+'}{scoreDiff} pts since last week
          </span>
        </div>
      )}

      {/* Score Range Reference */}
      <div className="relative z-10 mt-6 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }} />
          <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>80-100: Secure</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
          <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>60-79: Attention</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f97316' }} />
          <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>40-59: Dangerous</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
          <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>0-39: Critical</span>
        </div>
      </div>

      {/* Goal Section */}
      {animatedScore < 100 && !loading && (
        <div className="relative z-10 mt-6 p-4 rounded-lg border" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}>
          <div className="flex items-center gap-3 mb-2">
            <Target size={18} style={{ color: 'hsl(var(--primary-gold))' }} />
            <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Path to 100
            </span>
          </div>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            You're {100 - animatedScore} points away from a perfect security score. 
            Complete the recommended actions below to improve.
          </p>
        </div>
      )}
    </div>
  );
};
