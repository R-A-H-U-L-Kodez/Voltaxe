import { ExternalLink } from 'lucide-react';

interface MitreAttackTagProps {
  techniqueId: string;
  techniqueName: string;
  className?: string;
}

export const MitreAttackTag = ({ techniqueId, techniqueName, className = '' }: MitreAttackTagProps) => {
  const mitreUrl = `https://attack.mitre.org/techniques/${techniqueId}/`;

  return (
    <a
      href={mitreUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 hover:text-purple-200 hover:bg-purple-500/30 transition-colors group ${className}`}
      title={`View ${techniqueId} on MITRE ATT&CK Framework`}
    >
      <span className="font-mono text-sm font-medium">{techniqueId}</span>
      <span className="hidden sm:inline text-sm">: {techniqueName}</span>
      <ExternalLink 
        size={14} 
        className="opacity-60 group-hover:opacity-100 transition-opacity" 
      />
    </a>
  );
};

// Mapping of suspicious behaviors to MITRE ATT&CK techniques
export const getMitreMapping = (alertType: string, description: string) => {
  // Simple pattern matching - in production, this would be more sophisticated
  const lowerDesc = description.toLowerCase();
  const lowerType = alertType.toLowerCase();

  if (lowerDesc.includes('zsh') || lowerDesc.includes('bash') || lowerDesc.includes('cmd') || 
      lowerDesc.includes('powershell') || lowerType.includes('command')) {
    return {
      techniqueId: 'T1059.004',
      techniqueName: 'Command and Scripting Interpreter: Unix Shell'
    };
  }

  if (lowerDesc.includes('network') || lowerDesc.includes('connection') || 
      lowerType.includes('network')) {
    return {
      techniqueId: 'T1071.001',
      techniqueName: 'Application Layer Protocol: Web Protocols'
    };
  }

  if (lowerDesc.includes('file') || lowerDesc.includes('write') || 
      lowerDesc.includes('create') || lowerType.includes('file')) {
    return {
      techniqueId: 'T1105',
      techniqueName: 'Ingress Tool Transfer'
    };
  }

  if (lowerDesc.includes('process') || lowerDesc.includes('execution') || 
      lowerType.includes('process')) {
    return {
      techniqueId: 'T1059',
      techniqueName: 'Command and Scripting Interpreter'
    };
  }

  if (lowerDesc.includes('privilege') || lowerDesc.includes('escalation') || 
      lowerType.includes('privilege')) {
    return {
      techniqueId: 'T1548',
      techniqueName: 'Abuse Elevation Control Mechanism'
    };
  }

  if (lowerDesc.includes('persistence') || lowerDesc.includes('startup') || 
      lowerType.includes('persistence')) {
    return {
      techniqueId: 'T1547',
      techniqueName: 'Boot or Logon Autostart Execution'
    };
  }

  // Default for suspicious behavior
  return {
    techniqueId: 'T1036',
    techniqueName: 'Masquerading'
  };
};