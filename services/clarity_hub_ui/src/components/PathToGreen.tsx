import { useState, useEffect } from 'react';
import { Target, CheckCircle, AlertTriangle, ArrowRight, Award } from 'lucide-react';
import { snapshotService, incidentService, resilienceService } from '../services/api';
import { Snapshot, Incident } from '../types';

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
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [currentScore, setCurrentScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [snapshotsData, incidentsResponse, dashboard] = await Promise.all([
          snapshotService.getSnapshots(),
          incidentService.getIncidents(),
          resilienceService.getResilienceDashboard()
        ]);
        
        setSnapshots(snapshotsData);
        setIncidents(incidentsResponse.incidents);
        setCurrentScore(Math.round(dashboard.summary.average_score));
        
        // Generate recommendations from real data
        const recs = generateRecommendations(snapshotsData, incidentsResponse.incidents);
        setRecommendations(recs);
      } catch (error) {
        console.error('Failed to fetch PathToGreen data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const generateRecommendations = (snaps: Snapshot[], incs: Incident[]): Recommendation[] => {
    const recs: Recommendation[] = [];
    let recId = 1;

    // Critical incidents
    const criticalIncidents = incs.filter(i => i.status === 'open' && i.severity === 'critical');
    if (criticalIncidents.length > 0) {
      const hosts = criticalIncidents.slice(0, 3).map(i => i.affected_hosts[0]).filter(Boolean).join(', ');
      recs.push({
        id: recId++,
        title: `Resolve ${criticalIncidents.length} critical incident${criticalIncidents.length > 1 ? 's' : ''}`,
        description: `Critical threats detected${hosts ? ` on ${hosts}` : ''}. Immediate action required to improve security score by 10 points.`,
        impact: 'high',
        points: 10,
        priority: 1,
        completed: false,
      });
    }

    // High severity incidents
    const highIncidents = incs.filter(i => i.status === 'open' && i.severity === 'high');
    if (highIncidents.length > 0) {
      recs.push({
        id: recId++,
        title: `Address ${highIncidents.length} high-priority alert${highIncidents.length > 1 ? 's' : ''}`,
        description: `High-priority security alerts require attention. Resolution will improve score by 6 points.`,
        impact: 'high',
        points: 6,
        priority: 2,
        completed: false,
      });
    }

    // Offline endpoints
    const offlineEndpoints = snaps.filter(s => s.status === 'offline');
    if (offlineEndpoints.length > 0) {
      const hosts = offlineEndpoints.slice(0, 3).map(e => e.hostname).join(', ');
      recs.push({
        id: recId++,
        title: `Restore ${offlineEndpoints.length} offline endpoint${offlineEndpoints.length > 1 ? 's' : ''}`,
        description: `Endpoints ${hosts} are offline. Restoring connectivity will add 5 points to your score.`,
        impact: 'high',
        points: 5,
        priority: 3,
        completed: false,
      });
    }

    // High risk category endpoints
    const highRiskEndpoints = snaps.filter(s => s.risk_category === 'HIGH' || s.risk_category === 'CRITICAL');
    if (highRiskEndpoints.length > 0) {
      recs.push({
        id: recId++,
        title: `Remediate ${highRiskEndpoints.length} high-risk endpoint${highRiskEndpoints.length > 1 ? 's' : ''}`,
        description: `Endpoints in high-risk category need immediate attention. Remediation will improve score by 8 points.`,
        impact: 'high',
        points: 8,
        priority: 4,
        completed: false,
      });
    }

    // Medium severity incidents
    const mediumIncidents = incs.filter(i => i.status === 'open' && i.severity === 'medium');
    if (mediumIncidents.length > 0) {
      recs.push({
        id: recId++,
        title: `Investigate ${mediumIncidents.length} medium-priority alert${mediumIncidents.length > 1 ? 's' : ''}`,
        description: `Medium-priority alerts detected. Investigation and resolution will add 4 points.`,
        impact: 'medium',
        points: 4,
        priority: 5,
        completed: false,
      });
    }

    // General endpoint health
    const onlineEndpoints = snaps.filter(s => s.status === 'online');
    if (onlineEndpoints.length > 0) {
      recs.push({
        id: recId++,
        title: 'Maintain endpoint monitoring',
        description: `${onlineEndpoints.length} endpoints actively monitored. Keep monitoring enabled to maintain score. +2 points.`,
        impact: 'low',
        points: 2,
        priority: 6,
        completed: false,
      });
    }

    return recs.slice(0, 6); // Limit to top 6 recommendations
  };

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

  if (loading) {
    return (
      <div className="card p-6">
        <div className="text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Loading recommendations...
        </div>
      </div>
    );
  }

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
