import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { AlertsTable } from '../components/AlertsTable';
import { CVEDetailsModal } from '../components/CVEDetailsModal';
import { ReportGenerator } from '../components/ReportGenerator';
import { alertService } from '../services/api';
import { Alert } from '../types';
import { generateSecurityReport } from '../utils/reportGenerator';
import { Search, Loader2 } from 'lucide-react';

export const AlertsPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCVE, setSelectedCVE] = useState<string | null>(null);
  const [isCVEModalOpen, setIsCVEModalOpen] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (selectedSeverity !== 'all') {
        params.severity = selectedSeverity;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }

      const data = await alertService.getAlerts(params);
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedSeverity, startDate, endDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAlerts();
  };

  const handleCVEClick = (cveId: string) => {
    setSelectedCVE(cveId);
    setIsCVEModalOpen(true);
  };

  const handleReportGeneration = async (reportType: string, timeRange: string) => {
    try {
      await generateSecurityReport(reportType, timeRange);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  const severityButtons: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Security Alerts</h1>
              <p className="text-foreground/70">Monitor and manage security events across your infrastructure</p>
            </div>
            <ReportGenerator onGenerateReport={handleReportGeneration} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-foreground text-sm mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by hostname or event type..."
                    className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary-gold"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="block text-foreground text-sm mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-primary-gold"
                  />
                </div>
                <div>
                  <label className="block text-foreground text-sm mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-primary-gold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-foreground text-sm mb-2">Severity Filter</label>
              <div className="flex gap-2">
                {severityButtons.map((btn) => (
                  <button
                    key={btn.value}
                    type="button"
                    onClick={() => setSelectedSeverity(btn.value)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      selectedSeverity === btn.value
                        ? 'bg-primary-gold text-background'
                        : 'bg-input text-foreground hover:bg-white/5'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-primary-gold animate-spin" size={48} />
          </div>
        ) : (
          <AlertsTable 
            alerts={alerts} 
            onAlertUpdate={fetchAlerts} 
            onCVEClick={handleCVEClick}
          />
        )}

        <CVEDetailsModal 
          cveId={selectedCVE || ''}
          isOpen={isCVEModalOpen}
          onClose={() => {
            setIsCVEModalOpen(false);
            setSelectedCVE(null);
          }}
        />
      </main>
    </div>
  );
};
