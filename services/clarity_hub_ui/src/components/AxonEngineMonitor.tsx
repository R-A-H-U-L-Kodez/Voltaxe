import { useState, useEffect } from 'react';
import { Activity, Cpu, Zap, Shield, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export const AxonEngineMonitor = () => {
  const [scanning, setScanning] = useState(true);
  const [activeScans, setActiveScans] = useState(3);

  useEffect(() => {
    // Simulate scanning activity
    const interval = setInterval(() => {
      setScanning(prev => !prev);
      setActiveScans(Math.floor(Math.random() * 5) + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const recentActivity = [
    { time: '2 min ago', action: 'Completed vulnerability scan on endpoint-01', status: 'success', icon: CheckCircle },
    { time: '5 min ago', action: 'Detected anomaly in network traffic', status: 'warning', icon: AlertTriangle },
    { time: '8 min ago', action: 'Updated threat intelligence database', status: 'success', icon: CheckCircle },
    { time: '12 min ago', action: 'Analyzed 247 security events', status: 'success', icon: CheckCircle },
    { time: '15 min ago', action: 'Completed CVE correlation analysis', status: 'success', icon: CheckCircle },
  ];

  const engineStats = [
    { label: 'Endpoints Monitored', value: '24', icon: Shield },
    { label: 'Threats Detected Today', value: '12', icon: AlertTriangle },
    { label: 'Active Scans', value: activeScans.toString(), icon: Activity },
    { label: 'Response Time', value: '< 1s', icon: Zap },
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
            <Cpu className="h-6 w-6" style={{ color: 'hsl(var(--accent-gold))' }} />
            <span>Axon Engine Activity</span>
          </h3>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            AI-powered threat hunting in real-time
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div 
            className={`w-3 h-3 rounded-full ${scanning ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: 'hsl(var(--success))' }}
          />
          <span className="text-sm font-medium" style={{ color: 'hsl(var(--success))' }}>
            {scanning ? 'Actively Scanning' : 'Standby'}
          </span>
        </div>
      </div>

      {/* Engine Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {engineStats.map((stat, index) => (
          <div 
            key={index}
            className="rounded-lg p-4"
            style={{ backgroundColor: 'hsl(var(--muted) / 0.3)', border: '1px solid hsl(var(--border))' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="h-4 w-4" style={{ color: 'hsl(var(--accent-gold))' }} />
              <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Activity Feed */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
          <Clock className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          Recent Activity
        </h4>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => {
            const StatusIcon = activity.icon;
            const statusColor = activity.status === 'success' 
              ? 'hsl(var(--success))' 
              : activity.status === 'warning'
              ? 'hsl(var(--warning))'
              : 'hsl(var(--danger))';

            return (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg transition-smooth hover-lift"
                style={{ backgroundColor: 'hsl(var(--muted) / 0.2)' }}
              >
                <div 
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `${statusColor.replace(')', ' / 0.1)')}` }}
                >
                  <StatusIcon className="h-4 w-4" style={{ color: statusColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                    {activity.action}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {activity.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Trust Message */}
      <div 
        className="mt-6 p-4 rounded-lg"
        style={{ backgroundColor: 'hsl(var(--accent-gold) / 0.05)', border: '1px solid hsl(var(--accent-gold) / 0.2)' }}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--accent-gold) / 0.1)' }}>
            <Cpu className="h-5 w-5" style={{ color: 'hsl(var(--accent-gold))' }} />
          </div>
          <div>
            <h4 className="font-semibold mb-1" style={{ color: 'hsl(var(--accent-gold))' }}>
              AI-Powered Protection Active
            </h4>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              The Axon Engine is continuously monitoring your infrastructure, correlating threat intelligence,
              and hunting for potential security issues. All systems are protected 24/7.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
