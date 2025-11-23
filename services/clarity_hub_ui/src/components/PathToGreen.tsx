import { useState } from 'react';
import { Target, CheckCircle, AlertTriangle, ArrowRight, Award } from 'lucide-react';

interface Recommendation {
  id: number;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  points: number;
  priority: number;
  completed: boolean;
}

export const PathToGreen = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: 1,
      title: 'Update critical vulnerabilities on endpoint-01',
      description: '3 critical CVEs detected. Apply security patches to improve score by 8 points.',
      impact: 'high',
      points: 8,
      priority: 1,
      completed: false,
    },
    {
      id: 2,
      title: 'Enable firewall on 2 endpoints',
      description: 'Endpoints endpoint-05 and endpoint-12 have firewall disabled. Enabling will add 5 points.',
      impact: 'high',
      points: 5,
      priority: 2,
      completed: false,
    },
    {
      id: 3,
      title: 'Resolve 4 unresolved security alerts',
      description: 'High-priority alerts require attention. Resolution will improve score by 4 points.',
      impact: 'medium',
      points: 4,
      priority: 3,
      completed: false,
    },
    {
      id: 4,
      title: 'Update antivirus definitions',
      description: '5 endpoints have outdated AV signatures. Update to gain 3 points.',
      impact: 'medium',
      points: 3,
      priority: 4,
      completed: false,
    },
    {
      id: 5,
      title: 'Isolate compromised device (endpoint-08)',
      description: 'Suspicious activity detected. Isolating will prevent score deduction.',
      impact: 'high',
      points: 6,
      priority: 5,
      completed: false,
    },
    {
      id: 6,
      title: 'Enable automatic updates',
      description: 'Configure auto-updates on 3 endpoints to maintain security posture. +2 points.',
      impact: 'low',
      points: 2,
      priority: 6,
      completed: false,
    },
  ]);

  const currentScore = 82;
  const potentialScore = currentScore + recommendations
    .filter(r => !r.completed)
    .reduce((sum, r) => sum + r.points, 0);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'hsl(var(--danger))';
      case 'medium': return 'hsl(var(--warning))';
      case 'low': return 'hsl(var(--success))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  const getImpactBg = (impact: string) => {
    switch (impact) {
      case 'high': return 'hsl(var(--danger) / 0.1)';
      case 'medium': return 'hsl(var(--warning) / 0.1)';
      case 'low': return 'hsl(var(--success) / 0.1)';
      default: return 'hsl(var(--muted) / 0.1)';
    }
  };

  const toggleComplete = (id: number) => {
    setRecommendations(prev =>
      prev.map(rec =>
        rec.id === id ? { ...rec, completed: !rec.completed } : rec
      )
    );
  };

  const pendingRecommendations = recommendations.filter(r => !r.completed);
  const completedRecommendations = recommendations.filter(r => r.completed);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
            <Target className="h-6 w-6" style={{ color: 'hsl(var(--success))' }} />
            <span>Path to Green</span>
          </h3>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Actionable steps to improve your security score
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Current Score
            </p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--primary-gold))' }}>
              {currentScore}
            </p>
          </div>
          <ArrowRight className="h-5 w-5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <div className="text-right">
            <p className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Potential Score
            </p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--success))' }}>
              {potentialScore}
            </p>
          </div>
        </div>
      </div>

      {/* Score Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Progress to Grade A (90+)
          </span>
          <span className="text-sm font-medium" style={{ color: 'hsl(var(--success))' }}>
            {potentialScore}/90
          </span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--muted))' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(potentialScore / 90) * 100}%`,
              backgroundColor: potentialScore >= 90 ? 'hsl(var(--success))' : 'hsl(var(--primary-gold))',
            }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {potentialScore >= 90 
            ? '🎉 You can achieve Grade A by completing these recommendations!'
            : `Complete ${Math.ceil((90 - currentScore) / 2)} more items to reach Grade A`
          }
        </p>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
          <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(var(--warning))' }} />
          Priority Actions ({pendingRecommendations.length})
        </h4>
        
        {pendingRecommendations.map((rec) => (
          <div
            key={rec.id}
            className="flex items-start gap-4 p-4 rounded-lg transition-smooth hover-lift cursor-pointer"
            style={{ backgroundColor: 'hsl(var(--muted) / 0.2)', border: '1px solid hsl(var(--border))' }}
            onClick={() => toggleComplete(rec.id)}
          >
            <div className="flex-shrink-0 pt-1">
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                {rec.completed && <CheckCircle className="h-5 w-5" style={{ color: 'hsl(var(--success))' }} />}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h5 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    #{rec.priority}. {rec.title}
                  </h5>
                  <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {rec.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: getImpactBg(rec.impact),
                      color: getImpactColor(rec.impact),
                    }}
                  >
                    {rec.impact.toUpperCase()}
                  </span>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: 'hsl(var(--success))' }}>
                      +{rec.points}
                    </p>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      points
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {completedRecommendations.length > 0 && (
          <>
            <h4 className="text-sm font-semibold flex items-center gap-2 mt-6" style={{ color: 'hsl(var(--foreground))' }}>
              <CheckCircle className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />
              Completed ({completedRecommendations.length})
            </h4>
            {completedRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex items-start gap-4 p-4 rounded-lg transition-smooth opacity-60"
                style={{ backgroundColor: 'hsl(var(--success) / 0.05)', border: '1px solid hsl(var(--success) / 0.2)' }}
                onClick={() => toggleComplete(rec.id)}
              >
                <div className="flex-shrink-0 pt-1">
                  <CheckCircle className="h-6 w-6" style={{ color: 'hsl(var(--success))' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold line-through" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    #{rec.priority}. {rec.title}
                  </h5>
                  <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Completed • Earned +{rec.points} points
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Achievement Message */}
      {potentialScore >= 90 && (
        <div
          className="mt-6 p-4 rounded-lg"
          style={{ backgroundColor: 'hsl(var(--success) / 0.05)', border: '1px solid hsl(var(--success) / 0.2)' }}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--success) / 0.1)' }}>
              <Award className="h-5 w-5" style={{ color: 'hsl(var(--success))' }} />
            </div>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: 'hsl(var(--success))' }}>
                Excellent Progress!
              </h4>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                By completing these recommendations, you can achieve a Grade A security posture.
                Your organization will be in the top tier of security compliance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
