import { useState } from 'react';
import { Download, FileText, Calendar, Filter } from 'lucide-react';

interface ReportGeneratorProps {
  onGenerateReport: (reportType: string, timeRange: string) => void;
}

export const ReportGenerator = ({ onGenerateReport }: ReportGeneratorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reportType, setReportType] = useState('security-summary');
  const [timeRange, setTimeRange] = useState('7d');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerateReport(reportType, timeRange);
      // Success feedback could be added here
      console.log('✅ Report generated successfully!');
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary-gold text-black rounded-lg hover:bg-accent-gold font-medium"
      >
        <Download size={20} />
        Download Report
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-50 p-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="text-primary-gold" size={20} />
          <h3 className="font-semibold text-foreground">Generate Report</h3>
        </div>

        <div className="space-y-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-primary-gold"
            >
              <option value="security-summary">Security Summary</option>
              <option value="vulnerability-report">Vulnerability Report</option>
              <option value="alerts-analysis">Alerts Analysis</option>
              <option value="compliance-report">Compliance Report</option>
            </select>
          </div>

          {/* Time Range */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Calendar size={16} className="inline mr-1" />
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-primary-gold"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>

          {/* Report Description */}
          <div className="bg-input rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Filter size={16} className="text-primary-gold" />
              <span className="text-sm font-medium text-foreground">Report Contents</span>
            </div>
            <div className="text-xs text-foreground/70 space-y-1">
              {reportType === 'security-summary' && (
                <>
                  <div>• Executive security summary</div>
                  <div>• Critical alerts overview</div>
                  <div>• Security posture score</div>
                  <div>• Top vulnerabilities found</div>
                </>
              )}
              {reportType === 'vulnerability-report' && (
                <>
                  <div>• Detailed vulnerability listing</div>
                  <div>• CVSS scores and severity levels</div>
                  <div>• Affected endpoints breakdown</div>
                  <div>• Remediation recommendations</div>
                </>
              )}
              {reportType === 'alerts-analysis' && (
                <>
                  <div>• Alert frequency analysis</div>
                  <div>• MITRE ATT&CK technique mapping</div>
                  <div>• Endpoint risk assessment</div>
                  <div>• Incident timeline</div>
                </>
              )}
              {reportType === 'compliance-report' && (
                <>
                  <div>• Compliance framework status</div>
                  <div>• Security controls assessment</div>
                  <div>• Gap analysis and recommendations</div>
                  <div>• Executive compliance summary</div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-gold text-black rounded-lg hover:bg-accent-gold font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Generate PDF
                </>
              )}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};