import { useState } from 'react';
import { TrendingUp, Calendar, Award } from 'lucide-react';

export const SecurityTrends = () => {
  // Mock historical data - in production, this would come from API
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  
  const historicalData = {
    '7d': [
      { date: '18 Nov', score: 72 },
      { date: '19 Nov', score: 74 },
      { date: '20 Nov', score: 73 },
      { date: '21 Nov', score: 76 },
      { date: '22 Nov', score: 78 },
      { date: '23 Nov', score: 80 },
      { date: '24 Nov', score: 82 },
    ],
    '30d': [
      { date: 'Week 1', score: 65 },
      { date: 'Week 2', score: 70 },
      { date: 'Week 3', score: 75 },
      { date: 'Week 4', score: 82 },
    ],
    '90d': [
      { date: 'Sep', score: 58 },
      { date: 'Oct', score: 68 },
      { date: 'Nov', score: 82 },
    ],
  };

  const data = historicalData[selectedPeriod];
  const currentScore = data[data.length - 1].score;
  const previousScore = data[0].score;
  const improvement = currentScore - previousScore;
  const improvementPercent = ((improvement / previousScore) * 100).toFixed(1);

  const maxScore = Math.max(...data.map(d => d.score));
  const minScore = Math.min(...data.map(d => d.score));
  const range = maxScore - minScore || 1;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
            <TrendingUp className="h-6 w-6" style={{ color: 'hsl(var(--success))' }} />
            <span>Security Trends</span>
          </h3>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Track your security improvements over time
          </p>
        </div>
        
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                selectedPeriod === period
                  ? 'text-white'
                  : ''
              }`}
              style={{
                backgroundColor: selectedPeriod === period 
                  ? 'hsl(var(--primary-gold))' 
                  : 'hsl(var(--muted))',
                color: selectedPeriod === period 
                  ? 'white' 
                  : 'hsl(var(--muted-foreground))'
              }}
            >
              {period === '7d' && '7 Days'}
              {period === '30d' && '30 Days'}
              {period === '90d' && '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg p-4" style={{ backgroundColor: 'hsl(var(--success) / 0.1)', border: '1px solid hsl(var(--success) / 0.3)' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />
            <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Improvement</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'hsl(var(--success))' }}>
            +{improvement} points
          </p>
          <p className="text-xs" style={{ color: 'hsl(var(--success))' }}>
            {improvementPercent}% increase
          </p>
        </div>

        <div className="rounded-lg p-4" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)', border: '1px solid hsl(var(--primary-gold) / 0.3)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4" style={{ color: 'hsl(var(--primary-gold))' }} />
            <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Current Score</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'hsl(var(--primary-gold))' }}>
            {currentScore}/100
          </p>
          <p className="text-xs" style={{ color: 'hsl(var(--primary-gold))' }}>
            Grade: {currentScore >= 80 ? 'A' : currentScore >= 70 ? 'B' : currentScore >= 60 ? 'C' : 'D'}
          </p>
        </div>

        <div className="rounded-lg p-4" style={{ backgroundColor: 'hsl(var(--accent-gold) / 0.1)', border: '1px solid hsl(var(--accent-gold) / 0.3)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4" style={{ color: 'hsl(var(--accent-gold))' }} />
            <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Period</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'hsl(var(--accent-gold))' }}>
            {selectedPeriod === '7d' && '7 Days'}
            {selectedPeriod === '30d' && '1 Month'}
            {selectedPeriod === '90d' && '3 Months'}
          </p>
          <p className="text-xs" style={{ color: 'hsl(var(--accent-gold))' }}>
            Historical trend
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        <div className="absolute inset-0 flex items-end justify-between gap-2 px-4">
          {data.map((point, index) => {
            const heightPercent = ((point.score - minScore) / range) * 100;
            const isHighest = point.score === currentScore;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative group flex-1 flex items-end w-full">
                  <div
                    className="w-full rounded-t-lg transition-all duration-500 hover-lift cursor-pointer relative"
                    style={{
                      height: `${Math.max(heightPercent, 5)}%`,
                      backgroundColor: isHighest 
                        ? 'hsl(var(--primary-gold))'
                        : 'hsl(var(--accent-gold) / 0.6)',
                    }}
                  >
                    {/* Tooltip */}
                    <div 
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                      style={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <p className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                        Score: {point.score}
                      </p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {point.date}
                      </p>
                    </div>
                    
                    {/* Score label on bar */}
                    <span 
                      className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold"
                      style={{ color: 'hsl(var(--foreground))' }}
                    >
                      {point.score}
                    </span>
                  </div>
                </div>
                
                {/* Date label */}
                <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {point.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ROI Insight */}
      <div 
        className="mt-6 p-4 rounded-lg"
        style={{ backgroundColor: 'hsl(var(--success) / 0.05)', border: '1px solid hsl(var(--success) / 0.2)' }}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--success) / 0.1)' }}>
            <TrendingUp className="h-5 w-5" style={{ color: 'hsl(var(--success))' }} />
          </div>
          <div>
            <h4 className="font-semibold mb-1" style={{ color: 'hsl(var(--success))' }}>
              Positive ROI Trend
            </h4>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Your security posture has improved by <strong>{improvement} points</strong> in the selected period.
              {improvement >= 10 && ' Excellent progress! Keep up the good work.'}
              {improvement < 10 && improvement >= 5 && ' Good improvement. Continue monitoring and applying patches.'}
              {improvement < 5 && ' Consider reviewing Path to Green recommendations below for faster improvement.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
