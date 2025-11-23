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
      <div className="relative" style={{ height: '280px', paddingTop: '40px', paddingBottom: '30px' }}>
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between" style={{ paddingTop: '40px', paddingBottom: '30px' }}>
          {[100, 75, 50, 25, 0].map((value) => (
            <div key={value} className="flex items-center">
              <span className="text-xs w-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {value}
              </span>
              <div 
                className="flex-1 h-px" 
                style={{ backgroundColor: 'hsl(var(--border))' }}
              />
            </div>
          ))}
        </div>

        {/* Line Chart */}
        <div className="absolute inset-0" style={{ paddingLeft: '40px', paddingBottom: '30px', paddingRight: '10px', paddingTop: '40px' }}>
          <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
            {/* Define gradient for line */}
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: 'hsl(var(--accent-gold))', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'hsl(var(--primary-gold))', stopOpacity: 1 }} />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'hsl(var(--primary-gold))', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: 'hsl(var(--primary-gold))', stopOpacity: 0.05 }} />
              </linearGradient>
            </defs>

            {/* Calculate SVG dimensions */}
            {(() => {
              const svgWidth = 800; // approximate width
              const svgHeight = 200; // approximate height
              const points = data.map((point, index) => {
                const x = (index / (data.length - 1)) * svgWidth;
                const y = svgHeight - (point.score / 100) * svgHeight;
                return { x, y, score: point.score, date: point.date };
              });

              // Create path string for line
              const linePath = points.map((p, i) => 
                `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
              ).join(' ');

              // Create path string for area under line
              const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight} L 0 ${svgHeight} Z`;

              return (
                <g>
                  {/* Area under line */}
                  <path
                    d={areaPath}
                    fill="url(#areaGradient)"
                    className="transition-all duration-500"
                  />

                  {/* Grid lines connecting points */}
                  {points.map((point, index) => (
                    index < points.length - 1 && (
                      <line
                        key={`grid-${index}`}
                        x1={point.x}
                        y1={svgHeight}
                        x2={point.x}
                        y2={point.y}
                        stroke="hsl(var(--border))"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                        opacity="0.3"
                      />
                    )
                  ))}

                  {/* Main line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-500"
                  />

                  {/* Data points */}
                  {points.map((point, index) => {
                    const isHighest = point.score === maxScore;
                    
                    return (
                      <g key={index}>
                        {/* Point circle */}
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={isHighest ? 8 : 6}
                          fill={isHighest ? 'hsl(var(--primary-gold))' : 'hsl(var(--accent-gold))'}
                          stroke="hsl(var(--card))"
                          strokeWidth="2"
                          className="transition-all duration-300 hover:r-10 cursor-pointer"
                          style={{
                            filter: isHighest ? 'drop-shadow(0 0 8px hsl(var(--primary-gold)))' : 'none'
                          }}
                        >
                          <title>
                            {point.date}: {point.score}/100
                            {index > 0 && `\nChange: ${point.score > points[index - 1].score ? '+' : ''}${point.score - points[index - 1].score} points`}
                          </title>
                        </circle>

                        {/* Score label */}
                        <text
                          x={point.x}
                          y={point.y - 15}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight="bold"
                          fill="hsl(var(--foreground))"
                        >
                          {point.score}
                        </text>

                        {/* Date label below chart */}
                        <text
                          x={point.x}
                          y={svgHeight + 20}
                          textAnchor="middle"
                          fontSize="11"
                          fill="hsl(var(--muted-foreground))"
                        >
                          {point.date}
                        </text>

                        {/* Trend indicator */}
                        {index > 0 && (
                          <text
                            x={point.x}
                            y={point.y - 30}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="600"
                            fill={point.score > points[index - 1].score ? 'hsl(var(--success))' : 'hsl(var(--danger))'}
                          >
                            {point.score > points[index - 1].score ? '▲' : '▼'} {Math.abs(point.score - points[index - 1].score)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
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
