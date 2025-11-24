import { Incident } from '../types';

// MITRE ATT&CK mapping based on kill chain stages
export const MITRE_ATTACK_MAP: Record<string, { tactics: string[], techniques: string[] }> = {
  'Reconnaissance': {
    tactics: ['TA0043'],
    techniques: ['T1595', 'T1592', 'T1589']
  },
  'Initial Access': {
    tactics: ['TA0001'],
    techniques: ['T1190', 'T1133', 'T1566']
  },
  'Execution': {
    tactics: ['TA0002'],
    techniques: ['T1059', 'T1203', 'T1047']
  },
  'Persistence': {
    tactics: ['TA0003'],
    techniques: ['T1053', 'T1547', 'T1136']
  },
  'Privilege Escalation': {
    tactics: ['TA0004'],
    techniques: ['T1068', 'T1078', 'T1055']
  },
  'Defense Evasion': {
    tactics: ['TA0005'],
    techniques: ['T1070', 'T1112', 'T1027']
  },
  'Credential Access': {
    tactics: ['TA0006'],
    techniques: ['T1110', 'T1003', 'T1558']
  },
  'Discovery': {
    tactics: ['TA0007'],
    techniques: ['T1083', 'T1046', 'T1057']
  },
  'Lateral Movement': {
    tactics: ['TA0008'],
    techniques: ['T1021', 'T1563', 'T1080']
  },
  'Collection': {
    tactics: ['TA0009'],
    techniques: ['T1560', 'T1005', 'T1113']
  },
  'Command and Control': {
    tactics: ['TA0011'],
    techniques: ['T1071', 'T1573', 'T1132']
  },
  'Exfiltration': {
    tactics: ['TA0010'],
    techniques: ['T1041', 'T1048', 'T1567']
  },
  'Impact': {
    tactics: ['TA0040'],
    techniques: ['T1486', 'T1490', 'T1499']
  }
};

export const getMitreAttackIds = (killChainStage: string): string[] => {
  const mapping = MITRE_ATTACK_MAP[killChainStage];
  if (!mapping) return [];
  return [...mapping.tactics, ...mapping.techniques];
};

export const getMitreUrl = (id: string): string => {
  if (id.startsWith('TA')) {
    return `https://attack.mitre.org/tactics/${id}`;
  }
  return `https://attack.mitre.org/techniques/${id}`;
};

// Response playbooks based on kill chain and event types
export const getPlaybooksForIncident = (incident: Incident): any[] => {
  const playbooks: any[] = [];
  
  // Ransomware playbook
  if (incident.event_types.some(e => e.toLowerCase().includes('ransomware') || e.toLowerCase().includes('encryption'))) {
    playbooks.push({
      id: 'pb-ransomware',
      name: 'Ransomware Response',
      description: 'Immediate containment and recovery procedures for ransomware attacks',
      steps: [
        'Isolate all affected hosts immediately',
        'Disable network shares and remote access',
        'Identify patient zero and infection vector',
        'Check backup integrity and availability',
        'Document all encrypted files and extensions',
        'Contact incident response team and legal',
        'Do NOT pay ransom without leadership approval',
        'Restore from clean backups after verification'
      ],
      applicable_stages: ['Execution', 'Impact']
    });
  }
  
  // Lateral Movement playbook
  if (incident.kill_chain_stage === 'Lateral Movement' || incident.affected_hosts.length > 2) {
    playbooks.push({
      id: 'pb-lateral',
      name: 'Lateral Movement Containment',
      description: 'Stop attacker spreading across network',
      steps: [
        'Identify compromised accounts and disable them',
        'Block SMB/RDP traffic between affected hosts',
        'Review authentication logs for all hosts',
        'Reset credentials for all affected accounts',
        'Enable enhanced logging on critical servers',
        'Deploy EDR to uninstrumented hosts',
        'Segment network to limit blast radius'
      ],
      applicable_stages: ['Lateral Movement', 'Discovery']
    });
  }
  
  // Credential Access playbook
  if (incident.kill_chain_stage === 'Credential Access' || incident.event_types.some(e => e.toLowerCase().includes('credential'))) {
    playbooks.push({
      id: 'pb-credential',
      name: 'Credential Compromise Response',
      description: 'Secure accounts and reset credentials',
      steps: [
        'Force password reset for all affected accounts',
        'Revoke all active sessions and tokens',
        'Enable MFA on all compromised accounts',
        'Review privileged account usage',
        'Check for unauthorized account creation',
        'Rotate service account credentials',
        'Deploy credential guard on all endpoints'
      ],
      applicable_stages: ['Credential Access', 'Privilege Escalation']
    });
  }
  
  // Data Exfiltration playbook
  if (incident.kill_chain_stage === 'Exfiltration' || incident.event_types.some(e => e.toLowerCase().includes('exfil'))) {
    playbooks.push({
      id: 'pb-exfil',
      name: 'Data Exfiltration Response',
      description: 'Stop data leakage and assess impact',
      steps: [
        'Block outbound connections to suspicious IPs',
        'Review firewall logs for large data transfers',
        'Identify what data was accessed/exfiltrated',
        'Notify legal and compliance teams',
        'Determine if PII/PHI was compromised',
        'Prepare breach notification if required',
        'Enable DLP on all endpoints',
        'Conduct forensic analysis of affected systems'
      ],
      applicable_stages: ['Exfiltration', 'Collection']
    });
  }
  
  // Generic critical incident playbook
  if (incident.severity === 'critical' && playbooks.length === 0) {
    playbooks.push({
      id: 'pb-critical',
      name: 'Critical Incident Response',
      description: 'Standard procedures for high-severity incidents',
      steps: [
        'Activate incident response team',
        'Isolate affected systems',
        'Preserve evidence and logs',
        'Document timeline of events',
        'Identify scope and impact',
        'Contain threat and stop progression',
        'Notify stakeholders per policy',
        'Begin recovery and remediation'
      ],
      applicable_stages: Object.keys(MITRE_ATTACK_MAP)
    });
  }
  
  return playbooks;
};

// Find related incidents based on similarity
export const findRelatedIncidents = (currentIncident: Incident, allIncidents: Incident[]): any[] => {
  return allIncidents
    .filter(inc => inc.incident_id !== currentIncident.incident_id)
    .map(inc => {
      let score = 0;
      const commonEvents: string[] = [];
      
      // Check event type similarity
      currentIncident.event_types.forEach(et => {
        if (inc.event_types.includes(et)) {
          score += 30;
          commonEvents.push(et);
        }
      });
      
      // Check kill chain similarity
      if (inc.kill_chain_stage === currentIncident.kill_chain_stage) {
        score += 25;
      }
      
      // Check affected hosts overlap
      const commonHosts = inc.affected_hosts.filter(h => 
        currentIncident.affected_hosts.includes(h)
      );
      if (commonHosts.length > 0) {
        score += 20 * commonHosts.length;
      }
      
      // Check severity match
      if (inc.severity === currentIncident.severity) {
        score += 15;
      }
      
      // Check temporal proximity (within 7 days)
      const daysDiff = Math.abs(
        new Date(inc.first_seen).getTime() - new Date(currentIncident.first_seen).getTime()
      ) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 7) {
        score += 10;
      }
      
      return {
        incident_id: inc.incident_id,
        title: inc.title,
        similarity_score: Math.min(100, score),
        common_event_types: commonEvents,
        occurred_at: inc.first_seen
      };
    })
    .filter(rel => rel.similarity_score >= 30)
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, 5);
};

// Export incident to CSV
export const exportIncidentToCSV = (incident: Incident): void => {
  const headers = ['Field', 'Value'];
  const rows = [
    ['Incident ID', incident.incident_id],
    ['Title', incident.title],
    ['Description', incident.description],
    ['Severity', incident.severity],
    ['Status', incident.status],
    ['Assigned To', incident.assigned_to || 'Unassigned'],
    ['Alert Count', incident.alert_count.toString()],
    ['Affected Hosts', incident.affected_hosts.join(', ')],
    ['Event Types', incident.event_types.join(', ')],
    ['First Seen', new Date(incident.first_seen).toLocaleString()],
    ['Last Seen', new Date(incident.last_seen).toLocaleString()],
    ['Kill Chain Stage', incident.kill_chain_stage],
    ['MITRE ATT&CK', (incident.mitre_attack_ids || []).join(', ')],
    ['', ''],
    ['Recommended Actions', ''],
    ...incident.recommended_actions.map(action => ['', action]),
    ['', ''],
    ['Alert Timeline', ''],
    ['Timestamp', 'Event Type', 'Hostname', 'Details'],
    ...incident.alerts.map(alert => [
      new Date(alert.timestamp).toLocaleString(),
      alert.event_type,
      alert.hostname,
      alert.details
    ])
  ];
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `incident-${incident.incident_id}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export incident to PDF (simplified HTML approach)
export const exportIncidentToPDF = (incident: Incident): void => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Incident Report - ${incident.incident_id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 3px solid #dc2626; padding-bottom: 10px; }
        h2 { color: #666; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .badge { 
          display: inline-block; 
          padding: 4px 12px; 
          border-radius: 4px; 
          font-weight: bold;
          margin: 2px;
        }
        .critical { background: #dc2626; color: white; }
        .high { background: #ea580c; color: white; }
        .medium { background: #d97706; color: white; }
        .low { background: #65a30d; color: white; }
        .info-grid { display: grid; grid-template-columns: 200px 1fr; gap: 10px; margin: 20px 0; }
        .info-label { font-weight: bold; color: #555; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #f3f4f6; font-weight: bold; }
        tr:nth-child(even) { background: #f9fafb; }
        ul { margin: 10px 0; padding-left: 20px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>Security Incident Report</h1>
      <div class="info-grid">
        <div class="info-label">Incident ID:</div><div>${incident.incident_id}</div>
        <div class="info-label">Title:</div><div>${incident.title}</div>
        <div class="info-label">Severity:</div><div><span class="badge ${incident.severity}">${incident.severity.toUpperCase()}</span></div>
        <div class="info-label">Status:</div><div>${incident.status}</div>
        <div class="info-label">Assigned To:</div><div>${incident.assigned_to || 'Unassigned'}</div>
        <div class="info-label">Alert Count:</div><div>${incident.alert_count}</div>
        <div class="info-label">Affected Hosts:</div><div>${incident.affected_hosts.join(', ')}</div>
        <div class="info-label">First Seen:</div><div>${new Date(incident.first_seen).toLocaleString()}</div>
        <div class="info-label">Last Seen:</div><div>${new Date(incident.last_seen).toLocaleString()}</div>
        <div class="info-label">Kill Chain Stage:</div><div>${incident.kill_chain_stage}</div>
        <div class="info-label">MITRE ATT&CK:</div><div>${(incident.mitre_attack_ids || []).join(', ')}</div>
      </div>
      
      <h2>Description</h2>
      <p>${incident.description}</p>
      
      <h2>Event Types</h2>
      <p>${incident.event_types.map(e => `<span class="badge" style="background: #3b82f6; color: white;">${e}</span>`).join(' ')}</p>
      
      <h2>Recommended Actions</h2>
      <ul>
        ${incident.recommended_actions.map(action => `<li>${action}</li>`).join('')}
      </ul>
      
      <h2>Alert Timeline</h2>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Event Type</th>
            <th>Hostname</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${incident.alerts.map(alert => `
            <tr>
              <td>${new Date(alert.timestamp).toLocaleString()}</td>
              <td>${alert.event_type}</td>
              <td>${alert.hostname}</td>
              <td>${alert.details}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        Report generated on ${new Date().toLocaleString()} by Voltaxe Security Platform
      </div>
    </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

// Format duration
export const formatDuration = (firstSeen: string, lastSeen: string): string => {
  const diff = new Date(lastSeen).getTime() - new Date(firstSeen).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
};
