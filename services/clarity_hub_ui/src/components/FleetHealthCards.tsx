import { Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { FleetMetrics } from '../types';

interface FleetHealthCardsProps {
  metrics: FleetMetrics;
  loading?: boolean;
}

export const FleetHealthCards = ({ metrics, loading }: FleetHealthCardsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Endpoints',
      value: metrics.total_endpoints,
      icon: Activity,
      color: 'hsl(var(--primary-gold))',
      bgColor: 'hsl(var(--primary-gold) / 0.1)',
      borderColor: 'hsl(var(--primary-gold) / 0.3)',
      subtitle: 'Registered machines',
    },
    {
      title: 'Online Now',
      value: metrics.online_count,
      icon: CheckCircle,
      color: 'hsl(var(--success))',
      bgColor: 'hsl(var(--success) / 0.1)',
      borderColor: 'hsl(var(--success) / 0.3)',
      subtitle: `${metrics.total_endpoints > 0 ? Math.round((metrics.online_count / metrics.total_endpoints) * 100) : 0}% of fleet`,
    },
    {
      title: 'Offline',
      value: metrics.offline_count,
      icon: XCircle,
      color: 'hsl(var(--muted-foreground))',
      bgColor: 'hsl(var(--muted) / 0.5)',
      borderColor: 'hsl(var(--border))',
      subtitle: 'Need attention',
    },
    {
      title: 'High Risk',
      value: metrics.high_risk_count + metrics.critical_risk_count,
      icon: AlertTriangle,
      color: 'hsl(var(--danger))',
      bgColor: 'hsl(var(--danger) / 0.1)',
      borderColor: 'hsl(var(--danger) / 0.3)',
      subtitle: `${metrics.critical_risk_count} critical`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="card p-6 hover:shadow-lg transition-shadow"
            style={{
              backgroundColor: card.bgColor,
              border: `1px solid ${card.borderColor}`,
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: card.color + '20' }}>
                <Icon className="h-6 w-6" style={{ color: card.color }} />
              </div>
              {index === 3 && card.value > 0 && (
                <span
                  className="px-2 py-1 text-xs font-bold rounded-full animate-pulse"
                  style={{
                    backgroundColor: card.color,
                    color: 'white',
                  }}
                >
                  ACTION NEEDED
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {card.title}
              </p>
              <p className="text-4xl font-bold mb-1" style={{ color: card.color }}>
                {card.value.toLocaleString()}
              </p>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
