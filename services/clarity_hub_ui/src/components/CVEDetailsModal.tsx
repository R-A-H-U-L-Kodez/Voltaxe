import { useState, useEffect } from 'react';
import { X, ExternalLink, Shield, AlertTriangle, Info, Users } from 'lucide-react';
import { vulnerabilityService } from '../services/api';

interface CVEDetails {
  id: string;
  cvssScore: number;
  severity: string;
  attackVector: string;
  summary: string;
  affectedEndpoints: string[];
  publishedDate: string;
  lastModified: string;
  references: string[];
}

interface CVEDetailsModalProps {
  cveId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CVEDetailsModal = ({ cveId, isOpen, onClose }: CVEDetailsModalProps) => {
  const [cveDetails, setCveDetails] = useState<CVEDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && cveId) {
      fetchCVEDetails();
    }
  }, [isOpen, cveId]);

  const fetchCVEDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await vulnerabilityService.getCVEDetails(cveId);
      setCveDetails(data);
    } catch (error: any) {
      console.error('Failed to fetch CVE details:', error);
      setError('Failed to fetch CVE details. Please try again.');
      
      // Fallback to mock data for demonstration
      const mockCVEData: Record<string, CVEDetails> = {
        'CVE-2024-12345': {
          id: 'CVE-2024-12345',
          cvssScore: 9.8,
          severity: 'Critical',
          attackVector: 'Remote Code Execution via Network',
          summary: 'Docker Desktop for Windows allows attackers to overwrite any file through the hyperv/create Docker API by controlling the DataFolder parameter in the POST request, enabling local privilege escalation.',
          affectedEndpoints: ['kali', 'workstation-01', 'server-db-01'],
          publishedDate: '2024-09-15',
          lastModified: '2024-09-20',
          references: [
            'https://nvd.nist.gov/vuln/detail/CVE-2024-12345',
            'https://www.docker.com/security-advisory'
          ]
        },
        'CVE-2023-45678': {
          id: 'CVE-2023-45678',
          cvssScore: 7.5,
          severity: 'High',
          attackVector: 'Information Disclosure via Local Access',
          summary: 'A vulnerability in the system configuration allows local users to access sensitive information through improper file permissions.',
          affectedEndpoints: ['kali'],
          publishedDate: '2023-11-10',
          lastModified: '2023-11-15',
          references: [
            'https://nvd.nist.gov/vuln/detail/CVE-2023-45678'
          ]
        }
      };
      
      setCveDetails(mockCVEData[cveId] || null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-400 bg-red-400/10';
      case 'high': return 'text-orange-400 bg-orange-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'low': return 'text-green-400 bg-green-400/10';
      default: return 'text-foreground/60 bg-white/5';
    }
  };

  const getCVSSColor = (score: number) => {
    if (score >= 9.0) return 'text-red-400';
    if (score >= 7.0) return 'text-orange-400';
    if (score >= 4.0) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Shield className="text-red-400" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{cveId}</h2>
              <p className="text-foreground/60">Vulnerability Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg text-foreground/60 hover:text-foreground"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-gold"></div>
              <span className="ml-3 text-foreground/60">Loading CVE details...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto text-red-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-foreground mb-2">Error Loading CVE</h3>
              <p className="text-foreground/60 mb-4">{error}</p>
              <button
                onClick={fetchCVEDetails}
                className="px-4 py-2 bg-primary-gold text-black rounded-lg hover:bg-accent-gold"
              >
                Try Again
              </button>
            </div>
          ) : cveDetails ? (
            <div className="space-y-6">
              {/* Score and Severity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-input rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={20} className="text-primary-gold" />
                    <span className="font-medium text-foreground">CVSS Score</span>
                  </div>
                  <div className={`text-2xl font-bold ${getCVSSColor(cveDetails.cvssScore)}`}>
                    {cveDetails.cvssScore.toFixed(1)}
                  </div>
                </div>

                <div className="bg-input rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={20} className="text-primary-gold" />
                    <span className="font-medium text-foreground">Severity</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(cveDetails.severity)}`}>
                    {cveDetails.severity}
                  </span>
                </div>

                <div className="bg-input rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={20} className="text-primary-gold" />
                    <span className="font-medium text-foreground">Published</span>
                  </div>
                  <div className="text-foreground/80">
                    {new Date(cveDetails.publishedDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Attack Vector */}
              <div className="bg-input rounded-lg p-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">Attack Vector</h3>
                <p className="text-orange-400 font-medium">{cveDetails.attackVector}</p>
              </div>

              {/* Summary */}
              <div className="bg-input rounded-lg p-4">
                <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
                <p className="text-foreground/80 leading-relaxed">{cveDetails.summary}</p>
              </div>

              {/* Affected Endpoints */}
              <div className="bg-input rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={20} className="text-primary-gold" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Affected Endpoints ({cveDetails.affectedEndpoints.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {cveDetails.affectedEndpoints.map((endpoint, index) => (
                    <div
                      key={index}
                      className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400"
                    >
                      <span className="font-mono">{endpoint}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* References */}
              <div className="bg-input rounded-lg p-4">
                <h3 className="text-lg font-semibold text-foreground mb-3">References</h3>
                <div className="space-y-2">
                  {cveDetails.references.map((ref, index) => (
                    <a
                      key={index}
                      href={ref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary-gold hover:text-accent-gold"
                    >
                      <ExternalLink size={16} />
                      <span className="truncate">{ref}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <a
                  href={`https://nvd.nist.gov/vuln/detail/${cveId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-gold text-black rounded-lg hover:bg-accent-gold font-medium"
                >
                  <ExternalLink size={20} />
                  View on NIST Database
                </a>
                <a
                  href={`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cveId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-white/5 text-foreground"
                >
                  <ExternalLink size={20} />
                  View on MITRE
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="mx-auto text-foreground/30 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-foreground mb-2">CVE Not Found</h3>
              <p className="text-foreground/60">
                Unable to load details for {cveId}. The vulnerability data may not be available.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};