import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { 
  LayoutDashboard, 
  Shield, 
  FileWarning, 
  Target, 
  FileText, 
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  Clock,
  Server,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { resilienceService, incidentService } from '../services/api';
import { auditService } from '../services/auditService';

export const MainDashboard = () => {
  const navigate = useNavigate();
  const [resilienceScore, setResilienceScore] = useState<number>(0);
  const [riskDistribution, setRiskDistribution] = useState<any>({});
  const [incidentStats, setIncidentStats] = useState<any>(null);
  const [auditStats, setAuditStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch resilience data
        const [dashboardData, incidentsData, auditData] = await Promise.all([
          resilienceService.getResilienceDashboard().catch(() => null),
          incidentService.getIncidentStats().catch(() => null),
          auditService.getAuditLogs({ limit: 10, offset: 0 }).catch(() => null)
        ]);

        if (dashboardData) {
          setResilienceScore(dashboardData.summary.average_score);
          setRiskDistribution(dashboardData.summary.risk_distribution);
        }

        if (incidentsData) {
          setIncidentStats(incidentsData);
        }

        if (auditData) {
          setAuditStats({
            total: auditData.total,
            recent: auditData.logs.slice(0, 5)
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, color, link }: any) => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('StatCard clicked, navigating to:', link);
      navigate(link);
    };

    return (
      <div 
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(link);
          }
        }}
        className="card p-6 hover-lift transition-smooth group cursor-pointer"
        style={{ 
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
      >
        <div className="flex items-start justify-between mb-4" style={{ pointerEvents: 'none' }}>
          <div className={`p-3 rounded-lg`} style={{ backgroundColor: `hsl(var(--${color}) / 0.1)` }}>
            <Icon className="h-6 w-6" style={{ color: `hsl(var(--${color}))` }} />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs font-medium" style={{ color: `hsl(var(--success))` }}>
              <TrendingUp className="h-3 w-3" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <h3 className="text-2xl font-bold mb-1" style={{ color: 'hsl(var(--foreground))', pointerEvents: 'none' }}>{value}</h3>
        <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))', pointerEvents: 'none' }}>{title}</p>
        {subtitle && <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', pointerEvents: 'none' }}>{subtitle}</p>}
        <div className="mt-4 flex items-center gap-2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: `hsl(var(--${color}))`, pointerEvents: 'none' }}>
          <span>View Details</span>
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    );
  };

  const QuickActionCard = ({ icon: Icon, title, description, link, color }: any) => (
    <Link to={link} className="card p-5 hover-lift transition-smooth group cursor-pointer">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg`} style={{ backgroundColor: `hsl(var(--${color}) / 0.1)` }}>
          <Icon className="h-5 w-5" style={{ color: `hsl(var(--${color}))` }} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>{title}</h4>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: `hsl(var(--${color}))` }} />
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="flex items-center justify-center h-96">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4" style={{ borderColor: 'hsl(var(--border))' }}></div>
              <div 
                className="animate-spin rounded-full h-16 w-16 border-t-4 absolute top-0 left-0" 
                style={{ borderTopColor: 'hsl(var(--primary-gold))' }}
              ></div>
            </div>
            <span className="ml-4 text-xl" style={{ color: 'hsl(var(--foreground))' }}>Loading dashboard...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Page Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 gradient-gold rounded-2xl flex items-center justify-center shadow-xl">
              <LayoutDashboard size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient-gold">Command Center</h1>
              <p className="mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Complete overview of your security posture
              </p>
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Shield}
              title="Resilience Score"
              value={`${resilienceScore}/100`}
              subtitle="Overall security posture"
              trend="+5%"
              color="primary-gold"
              link="/resilience"
            />
            <StatCard
              icon={AlertTriangle}
              title="Active Incidents"
              value={incidentStats?.active_incidents || 0}
              subtitle={`${incidentStats?.critical_count || 0} critical, ${incidentStats?.high_count || 0} high`}
              color="danger"
              link="/incidents"
            />
            <StatCard
              icon={Server}
              title="Endpoints"
              value={riskDistribution ? Object.values(riskDistribution).reduce((a: any, b: any) => a + b, 0) : 0}
              subtitle={`${riskDistribution?.HIGH || 0} high risk, ${riskDistribution?.MEDIUM || 0} medium risk`}
              color="accent-gold"
              link="/add-endpoint"
            />
            <StatCard
              icon={Activity}
              title="System Activity"
              value={auditStats?.total || 0}
              subtitle="Total audit log entries"
              trend="Real-time"
              color="success"
              link="/audit-logs"
            />
          </div>
        </div>

        {/* Risk Distribution Overview */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Risk Distribution</h2>
            <Link to="/resilience" className="text-sm font-medium flex items-center gap-2" style={{ color: 'hsl(var(--primary-gold))' }}>
              View Full Report <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(riskDistribution).map(([risk, count]: [string, any]) => {
              const colors: any = {
                LOW: { bg: 'hsl(var(--success) / 0.1)', text: 'hsl(var(--success))', icon: 'hsl(var(--success))' },
                MEDIUM: { bg: 'hsl(var(--warning) / 0.1)', text: 'hsl(var(--warning))', icon: 'hsl(var(--warning))' },
                HIGH: { bg: 'hsl(var(--accent-gold) / 0.1)', text: 'hsl(var(--accent-gold))', icon: 'hsl(var(--accent-gold))' },
                CRITICAL: { bg: 'hsl(var(--danger) / 0.1)', text: 'hsl(var(--danger))', icon: 'hsl(var(--danger))' }
              };
              const color = colors[risk] || colors.LOW;
              
              return (
                <div key={risk} className="card p-5 border-l-4" style={{ borderLeftColor: color.icon }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>{risk}</p>
                      <p className="text-3xl font-bold mt-2" style={{ color: color.text }}>{count}</p>
                    </div>
                    {risk === 'LOW' && <CheckCircle className="h-6 w-6" style={{ color: color.icon }} />}
                    {risk === 'MEDIUM' && <AlertCircle className="h-6 w-6" style={{ color: color.icon }} />}
                    {risk === 'HIGH' && <AlertTriangle className="h-6 w-6" style={{ color: color.icon }} />}
                    {risk === 'CRITICAL' && <AlertTriangle className="h-6 w-6" style={{ color: color.icon }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'hsl(var(--foreground))' }}>Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickActionCard
              icon={Shield}
              title="Resilience Intelligence"
              description="View endpoint security scores and risk analysis"
              link="/resilience"
              color="primary-gold"
            />
            <QuickActionCard
              icon={FileWarning}
              title="Malware Scanner"
              description="Scan and analyze files for threats"
              link="/malware-scanner"
              color="danger"
            />
            <QuickActionCard
              icon={Target}
              title="Incident Management"
              description="Track and respond to security incidents"
              link="/incidents"
              color="accent-gold"
            />
            <QuickActionCard
              icon={FileText}
              title="Audit Logs"
              description="Review system activities and events"
              link="/audit-logs"
              color="success"
            />
            <QuickActionCard
              icon={Users}
              title="Team Management"
              description="Manage users, roles, and permissions"
              link="/team"
              color="primary-gold"
            />
            <QuickActionCard
              icon={Activity}
              title="Live Event Feed"
              description="Monitor real-time security events"
              link="/live-events"
              color="accent-gold"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Recent Incidents */}
          <div className="card">
            <div className="p-6 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Recent Incidents</h3>
                <Link to="/incidents" className="text-sm font-medium flex items-center gap-2" style={{ color: 'hsl(var(--primary-gold))' }}>
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
            <div className="p-6">
              {incidentStats?.active_incidents > 0 ? (
                <div className="space-y-3">
                  {[...Array(Math.min(3, incidentStats?.active_incidents || 0))].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: 'hsl(var(--danger))' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
                          Security Incident #{1000 + i}
                        </p>
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Detected {i + 1} hours ago
                        </p>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded" style={{ 
                        backgroundColor: 'hsl(var(--danger) / 0.1)',
                        color: 'hsl(var(--danger))'
                      }}>
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3" style={{ color: 'hsl(var(--success))' }} />
                  <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>No Active Incidents</p>
                  <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>All systems operating normally</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Audit Logs */}
          <div className="card">
            <div className="p-6 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Recent Activity</h3>
                <Link to="/audit-logs" className="text-sm font-medium flex items-center gap-2" style={{ color: 'hsl(var(--primary-gold))' }}>
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
            <div className="p-6">
              {auditStats?.recent && auditStats.recent.length > 0 ? (
                <div className="space-y-3">
                  {auditStats.recent.map((log: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                      <Clock className="h-5 w-5 flex-shrink-0" style={{ color: 'hsl(var(--accent-gold))' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
                          {log.action || 'System Activity'}
                        </p>
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {log.user_email || 'System'} • {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded" style={{ 
                        backgroundColor: log.severity === 'ERROR' 
                          ? 'hsl(var(--danger) / 0.1)' 
                          : log.severity === 'WARNING'
                          ? 'hsl(var(--warning) / 0.1)'
                          : 'hsl(var(--success) / 0.1)',
                        color: log.severity === 'ERROR'
                          ? 'hsl(var(--danger))'
                          : log.severity === 'WARNING'
                          ? 'hsl(var(--warning))'
                          : 'hsl(var(--success))'
                      }}>
                        {log.severity || 'INFO'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto mb-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>No Recent Activity</p>
                  <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Audit logs will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
