import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Award } from 'lucide-react';
import { resilienceService } from '../services/api';
import { ResilienceMetrics } from '../types';

export const SecurityTrends = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [metricsData, setMetricsData] = useState<ResilienceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch more data for different periods
        const limit = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
        console.log(`Fetching resilience metrics for period: ${selectedPeriod}, limit: ${limit}`);
        const data = await resilienceService.getResilienceMetrics(limit);
        console.log(`Received ${data?.length || 0} metrics for ${selectedPeriod}`);
        setMetricsData(data);
      } catch (error) {
        console.error('Failed to fetch resilience metrics', error);
        // Set empty data on error to prevent stale data
        setMetricsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  // Process data based on selected period
  const processData = () => {
    if (!metricsData || metricsData.length === 0) {
      return [];
    }

    // Sort by timestamp
    const sorted = [...metricsData].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    if (selectedPeriod === '7d') {
      // Last 7 days, daily granularity
      return sorted.slice(-7).map(m => ({
        date: new Date(m.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: m.resilience_score
      }));
    } else if (selectedPeriod === '30d') {
      // Last 30 days, weekly granularity
      const weeks: { date: string; scores: number[] }[] = [];
      sorted.slice(-30).forEach((m, idx) => {
        const weekIndex = Math.floor(idx / 7);
        if (!weeks[weekIndex]) {
          weeks[weekIndex] = { date: `Week ${weekIndex + 1}`, scores: [] };
        }
        weeks[weekIndex].scores.push(m.resilience_score);
      });
      return weeks.map(w => ({
        date: w.date,
        score: Math.round(w.scores.reduce((a, b) => a + b, 0) / w.scores.length)
      }));
    } else {
      // Last 90 days, monthly granularity
      const months: { [key: string]: number[] } = {};
      sorted.slice(-90).forEach(m => {
        const monthKey = new Date(m.timestamp).toLocaleDateString('en-US', { month: 'short' });
        if (!months[monthKey]) {
          months[monthKey] = [];
        }
        months[monthKey].push(m.resilience_score);
      });
      return Object.entries(months).map(([date, scores]) => ({
        date,
        score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      }));
    }
  };

  const data = processData();
  
  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-muted-foreground">Loading security trends…</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-xl font-bold mb-4">Security Trends</h3>
        <p className="text-sm text-muted-foreground">No historical data available yet</p>
      </div>
    );
  }

  const currentScore = data[data.length - 1]?.score || 0;
  const previousScore = data[0]?.score || 0;
  const improvement = currentScore - previousScore;
  const improvementPercent = previousScore > 0 ? ((improvement / previousScore) * 100).toFixed(1) : '0.0';

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
            Track your security improvements in Resilience Intelligence
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
      <div className="relative" style={{ height: '320px' }}>
        {/* Grid lines with Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between" style={{ width: '100%' }}>
          {[100, 75, 50, 25, 0].map((value) => (
            <div key={value} className="flex items-center w-full">
              <span className="text-xs w-10 text-right pr-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {value}
              </span>
              <div 
                className="flex-1 h-px" 
                style={{ backgroundColor: 'hsl(var(--border))' }}
              />
            </div>
          ))}
        </div>

        {/* SVG Line Chart */}
        <div className="absolute top-0 bottom-12" style={{ left: '50px', right: '20px', height: '240px' }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
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
              const svgWidth = 100;
              const svgHeight = 100;
              
              // Calculate points with proper scaling
              const points = data.map((point, index) => {
                const x = (data.length === 1)
                  ? svgWidth / 2
                  : (index / (data.length - 1)) * svgWidth;
                const y = svgHeight - (point.score / 100) * svgHeight;
                return { x, y, score: point.score, date: point.date };
              });

              // If only one point, just show a dot in the center
              if (points.length === 1) {
                const p = points[0];
                return (
                  <>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="2"
                      fill={'hsl(var(--primary-gold))'}
                      stroke="hsl(var(--card))"
                      strokeWidth="0.5"
                    >
                      <title>{p.date}: {p.score}/100</title>
                    </circle>
                    <text
                      x={p.x}
                      y={p.y - 5}
                      textAnchor="middle"
                      fontSize="3.5"
                      fontWeight="bold"
                      fill="hsl(var(--foreground))"
                    >
                      {p.score}
                    </text>
                  </>
                );
              }

              // Create path string for line
              const linePath = points.map((p, i) => 
                `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
              ).join(' ');

              // Create path string for area under line
              const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight} L 0 ${svgHeight} Z`;

              return (
                <>
                  {/* Area under line */}
                  <path
                    d={areaPath}
                    fill="url(#areaGradient)"
                    className="transition-all duration-500"
                  />

                  {/* Main line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-500"
                  />

                  {/* Data points */}
                  {points.map((point, index) => {
                    const isHighest = point.score === maxScore;
                    return (
                      <g key={index}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={isHighest ? "2" : "1.5"}
                          fill={isHighest ? 'hsl(var(--primary-gold))' : 'hsl(var(--accent-gold))'}
                          stroke="hsl(var(--card))"
                          strokeWidth="0.5"
                          className="transition-all duration-300 cursor-pointer"
                          style={{
                            filter: isHighest ? 'drop-shadow(0 0 2px hsl(var(--primary-gold)))' : 'none'
                          }}
                        >
                          <title>
                            {point.date}: {point.score}/100
                            {index > 0 && `\nChange: ${point.score > points[index - 1].score ? '+' : ''}${point.score - points[index - 1].score} points`}
                          </title>
                        </circle>
                        <text
                          x={point.x}
                          y={point.y - 4}
                          textAnchor="middle"
                          fontSize="3.5"
                          fontWeight="bold"
                          fill="hsl(var(--foreground))"
                        >
                          {point.score}
                        </text>
                        {index > 0 && (
                          <text
                            x={point.x}
                            y={point.y - 8}
                            textAnchor="middle"
                            fontSize="3"
                            fontWeight="600"
                            fill={point.score > points[index - 1].score ? 'hsl(var(--success))' : 'hsl(var(--danger))'}
                          >
                            {point.score > points[index - 1].score ? '▲' : '▼'} {Math.abs(point.score - points[index - 1].score)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>

        {/* X-axis labels (dates) */}
        <div className="absolute bottom-0 flex justify-between" style={{ left: '50px', right: '20px' }}>
          {data.map((point, index) => (
            <div 
              key={index} 
              className="text-xs text-center"
              style={{ 
                color: 'hsl(var(--muted-foreground))',
                flex: 1
              }}
            >
              {point.date}
            </div>
          ))}
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
