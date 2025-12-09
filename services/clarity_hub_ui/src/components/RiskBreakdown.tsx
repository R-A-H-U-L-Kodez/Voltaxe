import { useEffect, useState } from 'react';
import { AlertTriangle, Shield, Settings, TrendingDown } from 'lucide-react';
import { resilienceService, endpointService } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface RiskFactor {
  name: string;
  impact: number;
  color: string;
  icon: React.ReactNode;
  description: string;
}

interface TopOffender {
  id: string;
  hostname: string;
  riskContribution: number;
  issues: string[];
  riskLevel: string;
}

export const RiskBreakdown = () => {
  const [factors, setFactors] = useState<RiskFactor[]>([]);
  const [topOffenders, setTopOffenders] = useState<TopOffender[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRiskData();
  }, []);

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      const [dashboard, endpoints] = await Promise.all([
        resilienceService.getResilienceDashboard(),
        endpointService.getAllEndpoints()
      ]);

      // Calculate risk factors
      const riskFactors: RiskFactor[] = [];
      
      // Vulnerabilities impact
      const criticalVulns = dashboard.summary.risk_distribution.CRITICAL || 0;
      const highVulns = dashboard.summary.risk_distribution.HIGH || 0;
      const vulnImpact = -(criticalVulns * 5 + highVulns * 3);
      
      if (vulnImpact < 0) {
        riskFactors.push({
          name: 'Vulnerabilities',
          impact: vulnImpact,
          color: '#ef4444',
          icon: <AlertTriangle size={20} />,
          description: `${criticalVulns} critical and ${highVulns} high-severity CVEs detected`
        });
      }

      // Suspicious Events / Incidents impact (simplified for now)
      // TODO: Add incident tracking API
      // const incidentCount = 0;
      // const incidentImpact = -(incidentCount * 2);
      // Will be enabled when incident API is available

      // Configuration Gaps impact
      const offlineEndpoints = endpoints.filter(e => e.status === 'offline').length;
      const outdatedEndpoints = endpoints.filter(e => 
        e.last_seen && (new Date().getTime() - new Date(e.last_seen).getTime()) > 7 * 24 * 60 * 60 * 1000
      ).length;
      const configImpact = -(offlineEndpoints + outdatedEndpoints);
      
      if (configImpact < 0) {
        riskFactors.push({
          name: 'Configuration Gaps',
          impact: configImpact,
          color: '#f59e0b',
          icon: <Settings size={20} />,
          description: `${offlineEndpoints} offline and ${outdatedEndpoints} outdated endpoints`
        });
      }

      // If no issues, show positive factors
      if (riskFactors.length === 0) {
        riskFactors.push({
          name: 'Security Posture',
          impact: 0,
          color: '#10b981',
          icon: <Shield size={20} />,
          description: 'All systems operating within acceptable parameters'
        });
      }

      setFactors(riskFactors);

      // Calculate top offenders
      const offenders: TopOffender[] = endpoints
        .map(endpoint => {
          const issues: string[] = [];
          let riskScore = 0;

          // Check risk level
          if (endpoint.risk_level === 'CRITICAL') {
            issues.push('Critical risk level');
            riskScore += 20;
          } else if (endpoint.risk_level === 'HIGH') {
            issues.push('High risk level');
            riskScore += 15;
          }

          // Check status
          if (endpoint.status === 'offline') {
            issues.push('Currently offline');
            riskScore += 10;
          }

          // Check last seen
          if (endpoint.last_seen) {
            const daysSinceLastSeen = (new Date().getTime() - new Date(endpoint.last_seen).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceLastSeen > 7) {
              issues.push(`Not seen for ${Math.floor(daysSinceLastSeen)} days`);
              riskScore += 5;
            }
          }

          // Add CVE count if available
          const cveCount = endpoint.vulnerabilities?.length || 0;
          if (cveCount > 0) {
            issues.push(`${cveCount} vulnerabilit${cveCount !== 1 ? 'ies' : 'y'}`);
            riskScore += cveCount * 2;
          }

          return {
            id: endpoint.id,
            hostname: endpoint.hostname,
            riskContribution: riskScore,
            issues,
            riskLevel: endpoint.risk_level
          };
        })
        .filter(o => o.riskContribution > 0)
        .sort((a, b) => b.riskContribution - a.riskContribution)
        .slice(0, 5); // Top 5 offenders

      setTopOffenders(offenders);
    } catch (error) {
      console.error('Failed to fetch risk breakdown:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalNegativeImpact = factors.reduce((sum, f) => sum + Math.abs(f.impact), 0);

  return (
    <div 
      className="rounded-2xl p-6 border"
      style={{ 
        backgroundColor: 'hsl(var(--card))',
        borderColor: 'hsl(var(--border))'
      }}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)' }}>
            <TrendingDown size={24} style={{ color: 'hsl(var(--primary-gold))' }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
              Risk Breakdown
            </h2>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Understanding what's impacting your security score
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: 'hsl(var(--primary-gold))' }} />
        </div>
      ) : (
        <>
          {/* Factor Analysis */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
              Impact by Category
            </h3>
            <div className="space-y-4">
              {factors.map((factor, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg border transition-all duration-300 hover:shadow-lg"
                  style={{ 
                    borderColor: factor.color + '40',
                    backgroundColor: factor.color + '10'
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="p-2 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: factor.color + '20' }}
                    >
                      <div style={{ color: factor.color }}>
                        {factor.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                          {factor.name}
                        </span>
                        <span 
                          className="text-lg font-bold px-3 py-1 rounded-full"
                          style={{ 
                            color: factor.impact < 0 ? factor.color : '#10b981',
                            backgroundColor: factor.impact < 0 ? factor.color + '20' : '#10b98120'
                          }}
                        >
                          {factor.impact < 0 ? factor.impact : '+' + Math.abs(factor.impact)} pts
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {factor.description}
                      </p>
                      
                      {/* Impact bar */}
                      {totalNegativeImpact > 0 && factor.impact < 0 && (
                        <div className="mt-3">
                          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--border))' }}>
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${(Math.abs(factor.impact) / totalNegativeImpact) * 100}%`,
                                backgroundColor: factor.color
                              }}
                            />
                          </div>
                          <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {Math.round((Math.abs(factor.impact) / totalNegativeImpact) * 100)}% of total risk
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Offenders */}
          {topOffenders.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
                Top Risk Contributors
              </h3>
              <div className="space-y-3">
                {topOffenders.map((offender, index) => (
                  <div 
                    key={offender.id}
                    className="p-4 rounded-lg border cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                    style={{ 
                      borderColor: 'hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))'
                    }}
                    onClick={() => navigate(`/endpoint/${offender.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                        style={{ 
                          backgroundColor: index === 0 ? '#ef4444' : index === 1 ? '#f97316' : '#f59e0b'
                        }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>
                            {offender.hostname}
                          </span>
                          <span className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {offender.riskContribution}% of risk
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {offender.issues.map((issue, idx) => (
                            <span 
                              key={idx}
                              className="text-xs px-2 py-1 rounded"
                              style={{ 
                                backgroundColor: 'hsl(var(--primary-gold) / 0.1)',
                                color: 'hsl(var(--primary-gold))'
                              }}
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Click on any endpoint to view details and remediation options
              </p>
            </div>
          )}

          {topOffenders.length === 0 && factors.every(f => f.impact >= 0) && (
            <div 
              className="p-6 rounded-lg border text-center"
              style={{ 
                borderColor: '#10b98140',
                backgroundColor: '#10b98110'
              }}
            >
              <Shield size={48} className="mx-auto mb-3 text-green-500" />
              <p className="font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                Excellent Security Posture!
              </p>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                No significant risk factors detected. Continue monitoring to maintain this status.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
