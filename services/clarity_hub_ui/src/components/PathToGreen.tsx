import { useState, useEffect } from 'react';
import { Target, CheckCircle, AlertTriangle, ArrowRight, Award, Wrench, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resilienceService, endpointService } from '../services/api';
import axios from 'axios';

interface VulnerabilityDetail {
  cve_id: string;
  severity: string;
  cvss_score: number;
  description: string;
  affected_endpoints: string[];
  patch_available: boolean;
  detected_date: string;
  status: string;
  attack_vector?: string;
  patch_info?: {
    available: boolean;
    recommendation: string;
  };
}

interface Recommendation {
  id: number;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  points: number;
  priority: number;
  completed: boolean;
  cveIds?: string[];
  affectedEndpoints?: string[];
  fixable?: boolean;
  actionType?: 'vulnerability' | 'endpoint' | 'config' | 'malware';
  actionData?: any;
  cvssScore?: number;
  patchAvailable?: boolean;
}

interface PathToGreenProps {
  onScoreChange?: (bonusPoints: number) => void;
  onPriorityActionsUpdate?: (count: number) => void;
}

export const PathToGreen: React.FC<PathToGreenProps> = ({ onScoreChange, onPriorityActionsUpdate }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [currentScore, setCurrentScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Helper function to group vulnerabilities by CVE
  const groupByCVE = (vulnerabilities: VulnerabilityDetail[]) => {
    const grouped: { [key: string]: VulnerabilityDetail[] } = {};
    vulnerabilities.forEach(vuln => {
      if (!grouped[vuln.cve_id]) {
        grouped[vuln.cve_id] = [];
      }
      grouped[vuln.cve_id].push(vuln);
    });
    return grouped;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboard, endpoints] = await Promise.all([
          resilienceService.getResilienceDashboard(),
          endpointService.getAllEndpoints()
        ]);
        
        // Set current score from dashboard
        setCurrentScore(Math.round(dashboard.summary.average_score));
        
        // Fetch vulnerabilities for all endpoints
        const vulnPromises = endpoints.map(async (ep) => {
          try {
            const response = await axios.get(`/api/fleet/endpoints/${ep.id}/vulnerabilities`);
            return response.data.vulnerabilities || [];
          } catch (error) {
            console.error(`Failed to fetch vulnerabilities for ${ep.hostname}:`, error);
            return [];
          }
        });
        
        const allVulnerabilitiesNested = await Promise.all(vulnPromises);
        const allVulnerabilities: VulnerabilityDetail[] = allVulnerabilitiesNested.flat();
        
        // Generate recommendations based on real vulnerability data
        const generatedRecommendations: Recommendation[] = [];
        let priorityCounter = 1;

        // Group vulnerabilities by severity
        const criticalVulns = allVulnerabilities.filter(v => v.severity === 'CRITICAL');
        const highVulns = allVulnerabilities.filter(v => v.severity === 'HIGH');
        const mediumVulns = allVulnerabilities.filter(v => v.severity === 'MEDIUM');
        
        // Generate CVE-specific recommendations for CRITICAL vulnerabilities
        const criticalByCVE = groupByCVE(criticalVulns);
        for (const [cveId, vulnList] of Object.entries(criticalByCVE)) {
          const affectedHosts = [...new Set(vulnList.flatMap(v => v.affected_endpoints))];
          const vuln = vulnList[0];
          
          generatedRecommendations.push({
            id: priorityCounter++,
            title: `🚨 CRITICAL: Patch ${cveId}`,
            description: vuln.description.length > 200 ? vuln.description.substring(0, 200) + '...' : vuln.description,
            impact: 'high',
            points: 5,
            priority: priorityCounter - 1,
            completed: false,
            cveIds: [cveId],
            affectedEndpoints: affectedHosts,
            fixable: vuln.patch_available,
            actionType: 'vulnerability',
            actionData: { 
              cveId, 
              severity: 'CRITICAL', 
              patchAvailable: vuln.patch_available,
              endpointIds: endpoints.filter(e => affectedHosts.includes(e.hostname)).map(e => e.id)
            },
            cvssScore: vuln.cvss_score,
            patchAvailable: vuln.patch_available
          });
        }

        // Generate CVE-specific recommendations for HIGH vulnerabilities
        const highByCVE = groupByCVE(highVulns);
        for (const [cveId, vulnList] of Object.entries(highByCVE)) {
          const affectedHosts = [...new Set(vulnList.flatMap(v => v.affected_endpoints))];
          const vuln = vulnList[0];
          
          generatedRecommendations.push({
            id: priorityCounter++,
            title: `⚠️ HIGH: Patch ${cveId}`,
            description: vuln.description.length > 200 ? vuln.description.substring(0, 200) + '...' : vuln.description,
            impact: 'high',
            points: 3,
            priority: priorityCounter - 1,
            completed: false,
            cveIds: [cveId],
            affectedEndpoints: affectedHosts,
            fixable: vuln.patch_available,
            actionType: 'vulnerability',
            actionData: { 
              cveId, 
              severity: 'HIGH', 
              patchAvailable: vuln.patch_available,
              endpointIds: endpoints.filter(e => affectedHosts.includes(e.hostname)).map(e => e.id)
            },
            cvssScore: vuln.cvss_score,
            patchAvailable: vuln.patch_available
          });
        }

        // Generate CVE-specific recommendations for MEDIUM vulnerabilities (if space available)
        if (generatedRecommendations.length < 5) {
          const mediumByCVE = groupByCVE(mediumVulns);
          let mediumAdded = 0;
          for (const [cveId, vulnList] of Object.entries(mediumByCVE)) {
            if (mediumAdded >= 2) break; // Limit to 2 medium vulns
            
            const affectedHosts = [...new Set(vulnList.flatMap(v => v.affected_endpoints))];
            const vuln = vulnList[0];
            
            generatedRecommendations.push({
              id: priorityCounter++,
              title: `⚡ MEDIUM: Patch ${cveId}`,
              description: vuln.description.length > 200 ? vuln.description.substring(0, 200) + '...' : vuln.description,
              impact: 'medium',
              points: 2,
              priority: priorityCounter - 1,
              completed: false,
              cveIds: [cveId],
              affectedEndpoints: affectedHosts,
              fixable: vuln.patch_available,
              actionType: 'vulnerability',
              actionData: { 
                cveId, 
                severity: 'MEDIUM', 
                patchAvailable: vuln.patch_available,
                endpointIds: endpoints.filter(e => affectedHosts.includes(e.hostname)).map(e => e.id)
              },
              cvssScore: vuln.cvss_score,
              patchAvailable: vuln.patch_available
            });
            mediumAdded++;
          }
        }

        // Check for offline/at-risk endpoints
        const offlineEndpoints = endpoints.filter(e => e.status === 'offline');
        if (offlineEndpoints.length > 0) {
          generatedRecommendations.push({
            id: priorityCounter++,
            title: `Restore ${offlineEndpoints.length} offline endpoint${offlineEndpoints.length > 1 ? 's' : ''}`,
            description: `${offlineEndpoints.length} endpoint${offlineEndpoints.length > 1 ? 's are' : ' is'} currently offline or unreachable. Restore connectivity to improve monitoring coverage.`,
            impact: 'high',
            points: offlineEndpoints.length * 2,
            priority: priorityCounter - 1,
            completed: false,
            actionType: 'endpoint',
            actionData: { 
              endpointIds: offlineEndpoints.map(e => e.id),
              action: 'restore'
            }
          });
        }

        // Check for compromised endpoints
        const compromisedEndpoints = endpoints.filter(e => e.risk_level === 'CRITICAL' && e.status === 'online');
        if (compromisedEndpoints.length > 0) {
          generatedRecommendations.push({
            id: priorityCounter++,
            title: `Isolate ${compromisedEndpoints.length} high-risk endpoint${compromisedEndpoints.length > 1 ? 's' : ''}`,
            description: `${compromisedEndpoints.length} endpoint${compromisedEndpoints.length > 1 ? 's show' : ' shows'} critical risk indicators. Isolate to prevent lateral movement.`,
            impact: 'high',
            points: compromisedEndpoints.length * 4,
            priority: priorityCounter - 1,
            completed: false,
            actionType: 'endpoint',
            actionData: { 
              endpointIds: compromisedEndpoints.map(e => e.id),
              action: 'isolate'
            }
          });
        }

        // Check for endpoints needing updates
        const outdatedEndpoints = endpoints.filter(e => 
          e.last_seen && (new Date().getTime() - new Date(e.last_seen).getTime()) > 7 * 24 * 60 * 60 * 1000
        );
        if (outdatedEndpoints.length > 0 && generatedRecommendations.length < 6) {
          generatedRecommendations.push({
            id: priorityCounter++,
            title: `Update ${outdatedEndpoints.length} endpoint${outdatedEndpoints.length > 1 ? 's' : ''}`,
            description: `${outdatedEndpoints.length} endpoint${outdatedEndpoints.length > 1 ? 's have' : ' has'} not checked in recently. Enable automatic updates and verify agent status.`,
            impact: 'medium',
            points: Math.min(outdatedEndpoints.length, 4),
            priority: priorityCounter - 1,
            completed: false,
          });
        }

        // Add low priority recommendations to reach 100 if needed
        const lowCount = dashboard.summary.risk_distribution.LOW || 0;
        if (lowCount > 0 && generatedRecommendations.length < 6 && currentScore < 90) {
          generatedRecommendations.push({
            id: priorityCounter++,
            title: `Resolve ${lowCount} low-risk finding${lowCount > 1 ? 's' : ''}`,
            description: `${lowCount} informational finding${lowCount > 1 ? 's' : ''} detected. Address to achieve perfect security score.`,
            impact: 'low',
            points: Math.min(lowCount, 3),
            priority: priorityCounter - 1,
            completed: false,
          });
        }

        // If no recommendations, add a maintenance suggestion
        if (generatedRecommendations.length === 0) {
          generatedRecommendations.push({
            id: 1,
            title: 'Maintain current security posture',
            description: 'Continue monitoring and applying regular security updates to maintain your excellent security score.',
            impact: 'low',
            points: 0,
            priority: 1,
            completed: false,
          });
        }

        setRecommendations(generatedRecommendations);
        
        // Calculate and report priority actions count (high impact + not completed)
        const priorityCount = generatedRecommendations.filter(r => r.impact === 'high' && !r.completed).length;
        if (onPriorityActionsUpdate) {
          onPriorityActionsUpdate(priorityCount);
        }
      } catch (error) {
        console.error('Failed to fetch Path to Green data:', error);
        // Fallback to empty state
        setRecommendations([]);
        setCurrentScore(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);
  
  // Calculate scores dynamically based on completed recommendations
  const completedPoints = recommendations
    .filter(r => r.completed)
    .reduce((sum, r) => sum + r.points, 0);
  
  const displayScore = Math.min(100, currentScore + completedPoints);
  
  const totalPossiblePoints = recommendations
    .filter(r => !r.completed)
    .reduce((sum, r) => sum + r.points, 0);
  
  const potentialScore = Math.min(100, displayScore + totalPossiblePoints);

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

  const handleFixIt = (rec: Recommendation) => {
    if (rec.actionType === 'vulnerability' && rec.cveIds) {
      // Open NVD database for CVE research in new tab
      window.open(`https://nvd.nist.gov/vuln/detail/${rec.cveIds[0]}`, '_blank');
      
      // Navigate to first affected endpoint for remediation
      if (rec.actionData?.endpointIds?.[0]) {
        setTimeout(() => {
          navigate(`/endpoint/${rec.actionData.endpointIds[0]}`);
        }, 500);
      }
    } else if (rec.actionType === 'endpoint' && rec.actionData?.endpointIds?.[0]) {
      // Navigate directly to endpoint page
      navigate(`/endpoint/${rec.actionData.endpointIds[0]}`);
    }
  };

  const toggleComplete = (id: number) => {
    setRecommendations(prev => {
      const updated = prev.map(rec => {
        if (rec.id === id) {
          const newCompleted = !rec.completed;
          
          // Show visual feedback
          if (newCompleted) {
            console.log(`✓ Completed: ${rec.title} (+${rec.points} points)`);
          } else {
            console.log(`↩ Unchecked: ${rec.title} (-${rec.points} points)`);
          }
          
          return { ...rec, completed: newCompleted };
        }
        return rec;
      });
      
      // Calculate total completed points
      const totalCompleted = updated.filter(r => r.completed).reduce((sum, r) => sum + r.points, 0);
      const newDisplayScore = Math.min(100, currentScore + totalCompleted);
      console.log(`Current Score: ${currentScore} + ${totalCompleted} completed points = ${newDisplayScore}`);
      console.log(`Progress: ${newDisplayScore}/100 (${Math.round((newDisplayScore/100)*100)}%)`);
      
      // Notify parent component about score change
      if (onScoreChange) {
        onScoreChange(totalCompleted);
        console.log(`📊 Notified parent: +${totalCompleted} bonus points`);
      }
      
      // Calculate and report priority actions count (high impact + not completed)
      const priorityCount = updated.filter(r => r.impact === 'high' && !r.completed).length;
      if (onPriorityActionsUpdate) {
        onPriorityActionsUpdate(priorityCount);
        console.log(`⚠️  Priority actions: ${priorityCount}`);
      }
      
      return updated;
    });
  };

  const pendingRecommendations = recommendations.filter(r => !r.completed);
  const completedRecommendations = recommendations.filter(r => r.completed);

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4" style={{ color: 'hsl(var(--primary-gold))' }} />
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading recommendations...</p>
          </div>
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
            <p className="text-2xl font-bold transition-all duration-500" style={{ 
              color: completedPoints > 0 ? 'hsl(var(--success))' : 'hsl(var(--primary-gold))'
            }}>
              {displayScore}
              {completedPoints > 0 && (
                <span className="text-sm ml-1 text-green-500">
                  (+{completedPoints})
                </span>
              )}
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
            Progress to Perfect Score (100)
          </span>
          <span className="text-sm font-medium transition-all duration-500" style={{ 
            color: displayScore >= 90 ? 'hsl(var(--success))' : 'hsl(var(--primary-gold))'
          }}>
            {displayScore}/100 {displayScore >= 90 && '✓ Grade A'}
          </span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden relative" style={{ backgroundColor: 'hsl(var(--muted))' }}>
          {/* Base score (from API) */}
          <div
            className="h-full absolute left-0 top-0 transition-all duration-500"
            style={{
              width: `${currentScore}%`,
              backgroundColor: 'hsl(var(--primary-gold) / 0.5)',
            }}
          />
          {/* Completed tasks bonus */}
          {completedPoints > 0 && (
            <div
              className="h-full absolute left-0 top-0 transition-all duration-500"
              style={{
                width: `${displayScore}%`,
                backgroundColor: displayScore >= 90 ? 'hsl(var(--success))' : 'hsl(var(--primary-gold))',
              }}
            />
          )}
          {/* No completed tasks - show base score */}
          {completedPoints === 0 && (
            <div
              className="h-full absolute left-0 top-0 transition-all duration-500"
              style={{
                width: `${currentScore}%`,
                backgroundColor: currentScore >= 90 ? 'hsl(var(--success))' : 'hsl(var(--primary-gold))',
              }}
            />
          )}
        </div>
        <p className="text-xs mt-2 transition-all duration-500" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {displayScore >= 90 
            ? '🎉 Excellent! You have achieved Grade A security posture!'
            : completedPoints > 0
            ? `Great progress! Complete ${pendingRecommendations.length} more item${pendingRecommendations.length > 1 ? 's' : ''} to reach ${potentialScore}/100`
            : `Complete ${Math.min(pendingRecommendations.length, 3)} high-priority items to reach Grade A`
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
            className="flex items-start gap-4 p-4 rounded-lg transition-smooth hover-lift"
            style={{ backgroundColor: 'hsl(var(--muted) / 0.2)', border: '1px solid hsl(var(--border))' }}
          >
            <div className="flex-shrink-0 pt-1">
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer"
                style={{ borderColor: 'hsl(var(--border))' }}
                onClick={() => toggleComplete(rec.id)}
              >
                {rec.completed && <CheckCircle className="h-5 w-5" style={{ color: 'hsl(var(--success))' }} />}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <h5 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    #{rec.priority}. {rec.title}
                  </h5>
                  <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {rec.description}
                  </p>
                  
                  {/* CVE and Endpoint Information */}
                  {rec.cveIds && rec.cveIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {rec.cveIds.map(cve => (
                        <a
                          key={cve}
                          href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono hover:opacity-80 transition-opacity"
                          style={{ 
                            backgroundColor: 'hsl(var(--muted))',
                            color: 'hsl(var(--primary-gold))'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {cve}
                          <ExternalLink size={10} />
                        </a>
                      ))}
                      
                      {rec.cvssScore && (
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: rec.cvssScore >= 9 ? 'hsl(var(--danger) / 0.2)' : rec.cvssScore >= 7 ? 'hsl(var(--warning) / 0.2)' : 'hsl(var(--muted))',
                            color: rec.cvssScore >= 9 ? 'hsl(var(--danger))' : rec.cvssScore >= 7 ? 'hsl(var(--warning))' : 'hsl(var(--muted-foreground))'
                          }}
                        >
                          CVSS: {rec.cvssScore.toFixed(1)}/10
                        </span>
                      )}
                      
                      {rec.patchAvailable && (
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: 'hsl(var(--success) / 0.2)',
                            color: 'hsl(var(--success))'
                          }}
                        >
                          ✓ Patch Available
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Affected Endpoints */}
                  {rec.affectedEndpoints && rec.affectedEndpoints.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Affected:
                      </span>
                      {rec.affectedEndpoints.map((host, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded text-xs font-mono"
                          style={{ 
                            backgroundColor: 'hsl(var(--muted) / 0.5)',
                            color: 'hsl(var(--foreground))'
                          }}
                        >
                          {host}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Fix It Button */}
                  {rec.fixable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFixIt(rec);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg mt-3"
                      style={{
                        backgroundColor: 'hsl(var(--primary-gold))',
                        color: 'hsl(var(--background))'
                      }}
                    >
                      <Wrench size={16} />
                      Fix It Now
                    </button>
                  )}
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
