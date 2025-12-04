import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas'; // Not needed for professional 6-page design

interface ReportData {
  reportType: string;
  timeRange: string;
  generatedAt: Date;
  snapshots: any[];
  alerts: any[];
  events: any[];
  malware: any[];
  vulnerabilities: any[];
  rootkits: any[];
}

export const generateSecurityReport = async (reportType: string, timeRange: string) => {
  try {
    // Fetch real data from your API
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('[*] Fetching data for report generation...');
    
    const [snapshotsResponse, alertsResponse, eventsResponse, malwareResponse] = await Promise.all([
      fetch('/api/snapshots', { headers }),
      fetch('/api/alerts', { headers }),
      fetch('/api/events', { headers }),
      fetch('/api/malware/scans?limit=100', { headers })
    ]);

    const snapshots = await snapshotsResponse.json();
    const alerts = await alertsResponse.json();
    const events = await eventsResponse.json();
    const malwareScans = await malwareResponse.json();

    console.log('[*] API Response Summary:');
    console.log('  - Snapshots:', snapshots.length);
    console.log('  - Alerts:', alerts.length);
    console.log('  - Events:', events.length);
    console.log('  - Malware Scans:', malwareScans.length);

    // Filter events for vulnerabilities and rootkits
    // Note: API returns 'type' field, not 'event_type'
    const vulnerabilityEvents = events.filter((e: any) => e.type === 'VULNERABILITY_DETECTED');
    const rootkitEvents = events.filter((e: any) => e.type === 'ROOTKIT_DETECTED');

    console.log('[*] Filtered Events:');
    console.log('  - Vulnerabilities:', vulnerabilityEvents.length);
    console.log('  - Rootkits:', rootkitEvents.length);

    const reportData: ReportData = {
      reportType,
      timeRange,
      generatedAt: new Date(),
      snapshots: snapshots.map((snap: any) => {
        // Count actual vulnerabilities from events for this hostname
        const vulnCount = vulnerabilityEvents.filter((v: any) => v.hostname === snap.hostname).length;
        return {
          hostname: snap.hostname,
          vulnerabilities: vulnCount,
          lastScan: new Date(snap.timestamp)
        };
      }),
      alerts: alerts.map((alert: any) => {
        // Parse details if it's a JSON string or object
        let description = '';
        if (typeof alert.details === 'string') {
          try {
            const parsed = JSON.parse(alert.details);
            description = parsed.description || parsed.message || parsed.reason || alert.details;
          } catch (e) {
            description = alert.details;
          }
        } else if (typeof alert.details === 'object' && alert.details !== null) {
          description = alert.details.description || alert.details.message || alert.details.reason || JSON.stringify(alert.details);
        } else {
          description = alert.message || 'Alert detected';
        }
        
        return {
          type: alert.severity === 'critical' ? 'Critical' : 'Warning',
          description: description,
          timestamp: new Date(alert.timestamp)
        };
      }),
      events: events.map((event: any) => ({
        type: event.type,
        hostname: event.hostname,
        timestamp: new Date(event.timestamp)
      })),
      malware: malwareScans.map((scan: any) => ({
        fileName: scan.file_name,
        isMalicious: scan.is_malicious,
        threatLevel: scan.threat_level,
        scanTime: new Date(scan.scan_time),
        matches: scan.matches || []
      })),
      vulnerabilities: vulnerabilityEvents.map((vuln: any) => {
        // Try to parse details if it's a JSON string, otherwise use the string directly
        let parsedDetails = vuln.details;
        if (typeof vuln.details === 'string') {
          try {
            parsedDetails = JSON.parse(vuln.details);
          } catch (e) {
            // If parsing fails, use string as-is
            parsedDetails = { description: vuln.details };
          }
        }
        
        return {
          hostname: vuln.hostname,
          software: parsedDetails.vulnerable_software?.name || parsedDetails.software || 'Unknown',
          version: parsedDetails.vulnerable_software?.version || parsedDetails.version || 'Unknown',
          cve: parsedDetails.cve || 'N/A',
          reason: parsedDetails.reason || parsedDetails.description || vuln.details || 'No details',
          timestamp: new Date(vuln.timestamp || Date.now())
        };
      }),
      rootkits: rootkitEvents.map((rootkit: any) => {
        // Try to parse details if it's a JSON string, otherwise use the string directly
        let parsedDetails = rootkit.details;
        if (typeof rootkit.details === 'string') {
          try {
            parsedDetails = JSON.parse(rootkit.details);
          } catch (e) {
            // If parsing fails, use string as-is
            parsedDetails = { description: rootkit.details };
          }
        }
        
        return {
          hostname: rootkit.hostname,
          detectionMethod: parsedDetails.detection_method || parsedDetails.method || 'System scan',
          recommendation: parsedDetails.recommendation || parsedDetails.action || 'Immediate forensic investigation required',
          timestamp: new Date(rootkit.timestamp || Date.now())
        };
      })
    };

    console.log('[*] Report Data Summary:');
    console.log('  - Malware Detections:', reportData.malware.filter(m => m.isMalicious).length);
    console.log('  - Vulnerabilities:', reportData.vulnerabilities.length);
    console.log('  - Rootkits:', reportData.rootkits.length);

    // Generate PDF using jsPDF
    await generatePDFReport(reportData);
    
    return true;
  } catch (error) {
    console.error('Failed to generate report:', error);
    throw new Error(`Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const generatePDFReport = async (data: ReportData) => {
  try {
    console.log('[*] Starting PDF generation...');
    console.log('[*] Report Type:', data.reportType);
    
    // Route to different report generators based on report type
    switch (data.reportType) {
      case 'security-summary':
        console.log('[*] Generating Security Summary Report');
        generateSecuritySummaryPDF(data);
        break;
      case 'vulnerability-report':
        console.log('[*] Generating Vulnerability Assessment Report');
        generateVulnerabilityReportPDF(data);
        break;
      case 'alerts-analysis':
        console.log('[*] Generating Alerts Analysis Report');
        generateAlertsAnalysisPDF(data);
        break;
      case 'compliance-report':
        console.log('[*] Generating Compliance Status Report');
        generateComplianceReportPDF(data);
        break;
      default:
        console.log('[*] Generating Default Security Summary Report');
        generateSecuritySummaryPDF(data);
    }
    
    console.log('[+] Professional PDF generation successful');
    
  } catch (error) {
    console.error('[X] PDF generation failed:', error);
    throw new Error('Failed to generate PDF report. Please try again.');
  }
};

// Legacy HTML-to-Canvas method (disabled in favor of professional 6-page design)
// const generateAdvancedPDF = async (data: ReportData) => {
//   const htmlContent = generateHTMLReport(data);
//   const tempDiv = document.createElement('div');
//   tempDiv.innerHTML = htmlContent;
//   ... (commented out - see git history for full code)
// };

// ============= SECURITY SUMMARY REPORT (DEFAULT - COMPREHENSIVE) =============
const generateSecuritySummaryPDF = (data: ReportData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // ============= PAGE 1: COVER PAGE =============
  
  // Enhanced gradient background header
  pdf.setFillColor(25, 35, 65); // Dark navy blue
  pdf.rect(0, 0, pageWidth, 45, 'F');
  
  // Accent stripe
  pdf.setFillColor(212, 175, 55); // Gold accent
  pdf.rect(0, 42, pageWidth, 3, 'F');
  
  // Company Logo/Shield with better styling
  pdf.setFillColor(212, 175, 55); // Gold background for shield
  pdf.roundedRect(12, 12, 22, 22, 2, 2, 'F');
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 35, 65); // Dark text on gold background
  pdf.text('SHIELD', 23, 26, { align: 'center' });
  
  // Title with better spacing
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('VOLTAXE', 42, 26);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(200, 200, 200);
  pdf.text('SECURITY MONITORING PLATFORM', 42, 34);
  
  // Report Title Section with enhanced design
  pdf.setFontSize(26);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 35, 65);
  
  const reportTypeText = {
    'security-summary': 'Security Summary Report',
    'vulnerability-report': 'Vulnerability Assessment Report', 
    'alerts-analysis': 'Security Alerts Analysis',
    'compliance-report': 'Compliance Status Report'
  }[data.reportType] || 'Security Report';
  
  const titleWidth = pdf.getTextWidth(reportTypeText);
  pdf.text(reportTypeText, (pageWidth - titleWidth) / 2, 70);
  
  // Enhanced decorative elements
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(2);
  pdf.line(50, 75, pageWidth - 50, 75);
  
  // Subtitle accent line
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(180, 180, 180);
  pdf.line(60, 78, pageWidth - 60, 78);
  
  // Enhanced Report Metadata Box
  pdf.setFillColor(250, 252, 255); // Very light blue background
  pdf.setDrawColor(212, 175, 55); // Gold border
  pdf.setLineWidth(0.8);
  pdf.roundedRect(25, 90, pageWidth - 50, 50, 4, 4, 'FD');
  
  // Inner accent border
  pdf.setDrawColor(25, 35, 65);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(27, 92, pageWidth - 54, 46, 3, 3, 'D');
  
  const timeRangeText = {
    '1d': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days', 
    '90d': 'Last 90 Days'
  }[data.timeRange] || 'Custom Range';
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(80, 80, 80);
  pdf.text('Report Period:', 40, 95);
  pdf.text('Generated:', 40, 105);
  pdf.text('Classification:', 40, 115);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.text(timeRangeText, 80, 95);
  pdf.text(data.generatedAt.toLocaleString(), 80, 105);
  pdf.text('CONFIDENTIAL - INTERNAL USE ONLY', 80, 115);
  
  // Enhanced Executive Summary Section
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 35, 65);
  pdf.text('Executive Summary', 20, 155);
  
  // Decorative underline
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(1.5);
  pdf.line(20, 158, 90, 158);
  
  // Enhanced Metrics Cards with shadows and better design
  const totalVulns = data.snapshots.reduce((sum, s) => sum + s.vulnerabilities, 0);
  const malwareCount = data.malware.filter(m => m.isMalicious).length;
  const rootkitCount = data.rootkits.length;
  const criticalAlerts = data.alerts.filter(a => a.type === 'Critical').length;
  
  const metricsY = 175;
  const cardWidth = 52;
  const cardHeight = 38;
  const cardSpacing = 6;
  
  // Metric 1: Critical Alerts with shadow effect
  let cardX = 18;
  // Shadow
  pdf.setFillColor(0, 0, 0, 0.1);
  pdf.roundedRect(cardX + 1, metricsY + 1, cardWidth, cardHeight, 4, 4, 'F');
  
  // Main card
  pdf.setFillColor(220, 53, 69); // Enhanced red
  pdf.roundedRect(cardX, metricsY, cardWidth, cardHeight, 4, 4, 'F');
  
  // Card border highlight
  pdf.setDrawColor(255, 255, 255, 0.3);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(cardX + 1, metricsY + 1, cardWidth - 2, cardHeight - 2, 3, 3, 'D');
  
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(String(criticalAlerts + rootkitCount), cardX + cardWidth/2, metricsY + 18, { align: 'center' });
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CRITICAL', cardX + cardWidth/2, metricsY + 26, { align: 'center' });
  pdf.text('ALERTS', cardX + cardWidth/2, metricsY + 31, { align: 'center' });
  
  // Metric 2: Vulnerabilities with shadow
  cardX += cardWidth + cardSpacing;
  pdf.setFillColor(0, 0, 0, 0.1);
  pdf.roundedRect(cardX + 1, metricsY + 1, cardWidth, cardHeight, 4, 4, 'F');
  
  pdf.setFillColor(255, 193, 7); // Enhanced orange
  pdf.roundedRect(cardX, metricsY, cardWidth, cardHeight, 4, 4, 'F');
  
  pdf.setDrawColor(255, 255, 255, 0.3);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(cardX + 1, metricsY + 1, cardWidth - 2, cardHeight - 2, 3, 3, 'D');
  
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(String(totalVulns), cardX + cardWidth/2, metricsY + 18, { align: 'center' });
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('VULNERABILITIES', cardX + cardWidth/2, metricsY + 26, { align: 'center' });
  pdf.text('FOUND', cardX + cardWidth/2, metricsY + 31, { align: 'center' });
  
  // Metric 3: Malware with shadow
  cardX += cardWidth + cardSpacing;
  pdf.setFillColor(0, 0, 0, 0.1);
  pdf.roundedRect(cardX + 1, metricsY + 1, cardWidth, cardHeight, 4, 4, 'F');
  
  pdf.setFillColor(111, 66, 193); // Enhanced purple
  pdf.roundedRect(cardX, metricsY, cardWidth, cardHeight, 4, 4, 'F');
  
  pdf.setDrawColor(255, 255, 255, 0.3);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(cardX + 1, metricsY + 1, cardWidth - 2, cardHeight - 2, 3, 3, 'D');
  
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(String(malwareCount), cardX + cardWidth/2, metricsY + 18, { align: 'center' });
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('MALWARE', cardX + cardWidth/2, metricsY + 26, { align: 'center' });
  pdf.text('DETECTED', cardX + cardWidth/2, metricsY + 31, { align: 'center' });
  
  // Enhanced Security Posture Assessment
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 35, 65);
  pdf.text('Security Posture Assessment', 20, 230);
  
  const threatScore = criticalAlerts + rootkitCount + (totalVulns / 5) + (malwareCount * 2);
  let postureStatus = 'EXCELLENT';
  let postureColor: [number, number, number] = [40, 167, 69]; // Green
  
  if (threatScore > 10) {
    postureStatus = 'CRITICAL';
    postureColor = [220, 53, 69]; // Red
  } else if (threatScore > 5) {
    postureStatus = 'NEEDS ATTENTION';
    postureColor = [255, 193, 7]; // Orange
  } else if (threatScore > 2) {
    postureStatus = 'FAIR';
    postureColor = [23, 162, 184]; // Blue
  }
  
  // Enhanced status badge with shadow and highlight
  pdf.setFillColor(0, 0, 0, 0.15);
  pdf.roundedRect(21, 241, 160, 16, 3, 3, 'F');
  
  // Main status badge
  pdf.setFillColor(postureColor[0], postureColor[1], postureColor[2]);
  pdf.roundedRect(20, 240, 160, 16, 3, 3, 'F');
  
  // Status badge highlight
  pdf.setFillColor(255, 255, 255, 0.2);
  pdf.roundedRect(20, 240, 160, 8, 3, 3, 'F');
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(`STATUS: ${postureStatus}`, 100, 250, { align: 'center' });
  
  // Enhanced description with better typography
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Based on current threat analysis, vulnerability assessment, and security monitoring data.', 20, 265, { maxWidth: 170 });
  
  // Footer
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.3);
  pdf.line(20, 275, pageWidth - 20, 275);
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Voltaxe Clarity Hub - Confidential Security Report', 20, 282);
  pdf.text(`Page 1`, pageWidth - 30, 282);
  
  // ============= PAGE 2: ENDPOINT & ALERTS =============
  pdf.addPage();
  
  // Enhanced page header with gradient
  pdf.setFillColor(25, 35, 65); // Dark navy
  pdf.rect(0, 0, pageWidth, 15, 'F');
  pdf.setFillColor(212, 175, 55); // Gold accent
  pdf.rect(0, 12, pageWidth, 3, 'F');
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('VOLTAXE SECURITY REPORT', 15, 10);
  
  let yPos = 30;
  
  // Enhanced Endpoint Security Status section
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 35, 65);
  pdf.text('Monitored Endpoints Status', 20, yPos);
  
  // Section underline
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(1.5);
  pdf.line(20, yPos + 2, 120, yPos + 2);
  
  yPos += 15;
  
  // Enhanced table header with gradient
  pdf.setFillColor(25, 35, 65); // Dark header
  pdf.roundedRect(20, yPos, pageWidth - 40, 12, 2, 2, 'F');
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Hostname', 25, yPos + 8);
  pdf.text('Vulnerabilities', 90, yPos + 8);
  pdf.text('Risk Level', 140, yPos + 8);
  
  yPos += 12;
  
  // Enhanced table rows with better styling
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  data.snapshots.slice(0, 8).forEach((snapshot, index) => {
    const riskLevel = snapshot.vulnerabilities > 2 ? 'HIGH' : snapshot.vulnerabilities > 0 ? 'MEDIUM' : 'LOW';
    const riskColor: [number, number, number] = snapshot.vulnerabilities > 2 ? [220, 53, 69] : 
                     snapshot.vulnerabilities > 0 ? [255, 193, 7] : [40, 167, 69];
    
    // Enhanced alternating row colors with subtle borders
    if (index % 2 === 0) {
      pdf.setFillColor(250, 252, 255); // Very light blue
      pdf.roundedRect(20, yPos - 5, pageWidth - 40, 10, 1, 1, 'F');
    } else {
      pdf.setFillColor(255, 255, 255); // White
      pdf.roundedRect(20, yPos - 5, pageWidth - 40, 10, 1, 1, 'F');
    }
    
    // Subtle row border
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(20, yPos - 5, pageWidth - 40, 10, 1, 1, 'D');
    
    
    pdf.setTextColor(40, 40, 40);
    pdf.setFont('helvetica', 'normal');
    pdf.text(snapshot.hostname, 25, yPos);
    
    // Vulnerability count with better styling
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(snapshot.vulnerabilities), 95, yPos, { align: 'center' });
    
    // Enhanced risk level badge with shadow
    pdf.setFillColor(0, 0, 0, 0.1); // Shadow
    pdf.roundedRect(138, yPos - 3, 28, 8, 2, 2, 'F');
    
    pdf.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
    pdf.roundedRect(137, yPos - 4, 28, 8, 2, 2, 'F');
    
    // Badge highlight
    pdf.setFillColor(255, 255, 255, 0.2);
    pdf.roundedRect(137, yPos - 4, 28, 4, 2, 2, 'F');
    
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(riskLevel.toUpperCase(), 149.5, yPos, { align: 'center' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    yPos += 8;
  });
  
  yPos += 10;
  
  // Recent Critical Alerts
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(212, 175, 55);
  pdf.text('Recent Critical Alerts', 20, yPos);
  
  yPos += 8;
  
  data.alerts.slice(0, 4).forEach(alert => {
    // Alert box
    const alertColor: [number, number, number] = alert.type === 'Critical' ? [254, 242, 242] : [255, 251, 235];
    const borderColor: [number, number, number] = alert.type === 'Critical' ? [220, 53, 69] : [255, 193, 7];
    
    pdf.setFillColor(alertColor[0], alertColor[1], alertColor[2]);
    pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(20, yPos, pageWidth - 40, 15, 2, 2, 'FD');
    
    // Alert icon and type
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.text(alert.type === 'Critical' ? '[!] CRITICAL' : '[!] WARNING', 25, yPos + 6);
    
    // Alert description
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    const shortDesc = alert.description.length > 80 ? 
      alert.description.substring(0, 77) + '...' : 
      alert.description;
    pdf.text(shortDesc, 25, yPos + 12);
    
    yPos += 18;
  });
  
  // Footer
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.3);
  pdf.line(20, 275, pageWidth - 20, 275);
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Voltaxe Clarity Hub - Confidential Security Report', 20, 282);
  pdf.text(`Page 2`, pageWidth - 30, 282);
  
  // ============= PAGE 3: VULNERABILITY DETAILS =============
  pdf.addPage();
  
  // Page header
  pdf.setFillColor(212, 175, 55);
  pdf.rect(0, 0, pageWidth, 12, 'F');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('? VOLTAXE SECURITY REPORT', 15, 8);
  
  yPos = 25;
  
  // Vulnerability Details
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(212, 175, 55);
  pdf.text('Vulnerability Analysis', 20, yPos);
  
  yPos += 12;
  
  if (data.vulnerabilities.length > 0) {
    data.vulnerabilities.slice(0, 6).forEach((vuln) => {
      // Vulnerability card
      pdf.setFillColor(255, 249, 235);
      pdf.setDrawColor(255, 193, 7);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(20, yPos, pageWidth - 40, 28, 2, 2, 'FD');
      
      // Host badge
      pdf.setFillColor(255, 193, 7);
      pdf.roundedRect(25, yPos + 4, 30, 6, 1, 1, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('HOST', 40, yPos + 8, { align: 'center' });
      
      // Hostname
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40, 40, 40);
      pdf.text(vuln.hostname, 58, yPos + 8);
      
      // Software and version
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`${vuln.software} ${vuln.version}`, 25, yPos + 15);
      
      // CVE
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(220, 53, 69);
      pdf.text(`CVE: ${vuln.cve}`, 25, yPos + 21);
      
      // Description
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      const reason = vuln.reason.length > 90 ? vuln.reason.substring(0, 87) + '...' : vuln.reason;
      pdf.text(reason, 25, yPos + 27, { maxWidth: pageWidth - 50 });
      
      yPos += 32;
      
      if (yPos > 250) {
        pdf.addPage();
        // Page header
        pdf.setFillColor(212, 175, 55);
        pdf.rect(0, 0, pageWidth, 12, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text('? VOLTAXE SECURITY REPORT', 15, 8);
        yPos = 25;
      }
    });
  } else {
    pdf.setFillColor(236, 253, 245);
    pdf.setDrawColor(40, 167, 69);
    pdf.roundedRect(20, yPos, pageWidth - 40, 15, 2, 2, 'FD');
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(40, 167, 69);
    pdf.text('[OK] No vulnerabilities detected', 25, yPos + 10);
    yPos += 20;
  }
  
  // Footer
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.3);
  pdf.line(20, 275, pageWidth - 20, 275);
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Voltaxe Clarity Hub - Confidential Security Report', 20, 282);
  pdf.text(`Page 3`, pageWidth - 30, 282);
  
  // ============= PAGE 4: ROOTKIT ALERTS =============
  pdf.addPage();
  
  // Page header
  pdf.setFillColor(212, 175, 55);
  pdf.rect(0, 0, pageWidth, 12, 'F');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('VOLTAXE SECURITY REPORT', 15, 8);
  
  yPos = 25;
  
  // Rootkit Section
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(220, 53, 69);
  pdf.text('[!] CRITICAL: Rootkit Detection', 20, yPos);
  
  yPos += 12;
  
  if (data.rootkits.length > 0) {
    // Critical warning banner
    pdf.setFillColor(254, 242, 242);
    pdf.setDrawColor(220, 53, 69);
    pdf.setLineWidth(1);
    pdf.roundedRect(20, yPos, pageWidth - 40, 20, 2, 2, 'FD');
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(220, 53, 69);
    pdf.text('[!] IMMEDIATE ACTION REQUIRED', 25, yPos + 8);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(120, 53, 69);
    pdf.text('Rootkit detections indicate potential system compromise requiring urgent investigation.', 25, yPos + 15);
    
    yPos += 25;
    
    data.rootkits.forEach((rootkit) => {
      // Rootkit alert card
      pdf.setFillColor(255, 245, 245);
      pdf.setDrawColor(220, 53, 69);
      pdf.setLineWidth(1);
      pdf.roundedRect(20, yPos, pageWidth - 40, 25, 2, 2, 'FD');
      
      // Severity badge
      pdf.setFillColor(220, 53, 69);
      pdf.roundedRect(25, yPos + 4, 35, 7, 1, 1, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('CRITICAL', 42.5, yPos + 9, { align: 'center' });
      
      // Hostname
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(220, 53, 69);
      pdf.text(`HOST: ${rootkit.hostname}`, 65, yPos + 9);
      
      // Detection method
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Detection Method: ${rootkit.detectionMethod}`, 25, yPos + 16);
      
      // Recommendation
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(220, 53, 69);
      pdf.text(`Recommendation: ${rootkit.recommendation}`, 25, yPos + 22);
      
      yPos += 29;
      
      if (yPos > 250) {
        pdf.addPage();
        // Page header
        pdf.setFillColor(212, 175, 55);
        pdf.rect(0, 0, pageWidth, 12, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text('? VOLTAXE SECURITY REPORT', 15, 8);
        yPos = 25;
      }
    });
  } else {
    pdf.setFillColor(236, 253, 245);
    pdf.setDrawColor(40, 167, 69);
    pdf.roundedRect(20, yPos, pageWidth - 40, 15, 2, 2, 'FD');
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(40, 167, 69);
    pdf.text('[OK] No rootkits detected', 25, yPos + 10);
    yPos += 20;
  }
  
  // Footer
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.3);
  pdf.line(20, 275, pageWidth - 20, 275);
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Voltaxe Clarity Hub - Confidential Security Report', 20, 282);
  pdf.text(`Page 4`, pageWidth - 30, 282);
  
  // ============= PAGE 5: MALWARE DETECTIONS =============
  pdf.addPage();
  
  // Enhanced page header with gradient
  pdf.setFillColor(25, 35, 65); // Dark navy
  pdf.rect(0, 0, pageWidth, 15, 'F');
  pdf.setFillColor(212, 175, 55); // Gold accent
  pdf.rect(0, 12, pageWidth, 3, 'F');
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('VOLTAXE SECURITY REPORT', 15, 10);
  
  yPos = 30;
  
  // Enhanced Malware Section
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(111, 66, 193); // Purple theme
  pdf.text('[SCAN] Malware Detection Analysis', 20, yPos);
  
  // Section underline
  pdf.setDrawColor(111, 66, 193);
  pdf.setLineWidth(1.5);
  pdf.line(20, yPos + 2, 150, yPos + 2);
  
  yPos += 18;
  
  if (data.malware.length > 0) {
    const maliciousFiles = data.malware.filter(m => m.isMalicious);
    
    if (maliciousFiles.length > 0) {
      maliciousFiles.slice(0, 6).forEach((malware) => {
        // Enhanced malware card with shadow and gradient
        pdf.setFillColor(0, 0, 0, 0.08); // Shadow
        pdf.roundedRect(21, yPos + 1, pageWidth - 40, 26, 3, 3, 'F');
        
        // Main card background
        pdf.setFillColor(255, 252, 255); // Very light purple tint
        pdf.roundedRect(20, yPos, pageWidth - 40, 26, 3, 3, 'F');
        
        // Card border
        pdf.setDrawColor(111, 66, 193);
        pdf.setLineWidth(0.8);
        pdf.roundedRect(20, yPos, pageWidth - 40, 26, 3, 3, 'D');
        
        // Left accent stripe
        pdf.setFillColor(111, 66, 193);
        pdf.roundedRect(20, yPos, 4, 26, 3, 3, 'F');
        
        // Enhanced threat level badge with shadow
        const threatColor: [number, number, number] = malware.threatLevel === 'High' ? [220, 53, 69] :
                          malware.threatLevel === 'Medium' ? [255, 193, 7] : [111, 66, 193];
        
        // Badge shadow
        pdf.setFillColor(0, 0, 0, 0.1);
        pdf.roundedRect(28, yPos + 5, 32, 8, 2, 2, 'F');
        
        // Main badge
        pdf.setFillColor(threatColor[0], threatColor[1], threatColor[2]);
        pdf.roundedRect(27, yPos + 4, 32, 8, 2, 2, 'F');
        
        // Badge highlight
        pdf.setFillColor(255, 255, 255, 0.3);
        pdf.roundedRect(27, yPos + 4, 32, 4, 2, 2, 'F');
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text(malware.threatLevel.toUpperCase(), 43, yPos + 9, { align: 'center' });
        
        // Enhanced filename with icon
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(25, 35, 65);
        const fileName = malware.fileName.length > 45 ? 
          malware.fileName.substring(0, 42) + '...' : 
          malware.fileName;
        pdf.text(`[FILE] ${fileName}`, 65, yPos + 9);
        
        // Enhanced signatures section
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(111, 66, 193);
        const matchNames = malware.matches.slice(0, 3).map((m: any) => {
          // API returns objects with rule_name property
          if (typeof m === 'string') return m;
          return m.rule_name || m.rule || m.name || m.signature || 'Unknown';
        });
        const signatures = matchNames.length > 0 ? matchNames.join(', ') : 'Generic detection';
        pdf.text(`Signatures: ${signatures}`, 27, yPos + 17);
        
        // Enhanced scan time with icon
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`[CLOCK] Scanned: ${malware.scanTime.toLocaleString()}`, 27, yPos + 22);
        
        yPos += 30;
        
        if (yPos > 250) {
          pdf.addPage();
          // Page header
          pdf.setFillColor(212, 175, 55);
          pdf.rect(0, 0, pageWidth, 12, 'F');
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 255, 255);
          pdf.text('VOLTAXE SECURITY REPORT', 15, 8);
          yPos = 25;
        }
      });
    } else {
      pdf.setFillColor(236, 253, 245);
      pdf.setDrawColor(40, 167, 69);
      pdf.roundedRect(20, yPos, pageWidth - 40, 15, 2, 2, 'FD');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40, 167, 69);
      pdf.text('[OK] Files scanned - no malware detected', 25, yPos + 10);
      yPos += 20;
    }
  } else {
    pdf.setFillColor(240, 248, 255);
    pdf.setDrawColor(23, 162, 184);
    pdf.roundedRect(20, yPos, pageWidth - 40, 15, 2, 2, 'FD');
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(23, 162, 184);
    pdf.text('[i] No malware scans performed yet', 25, yPos + 10);
    yPos += 20;
  }
  
  // Footer
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.3);
  pdf.line(20, 275, pageWidth - 20, 275);
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Voltaxe Clarity Hub - Confidential Security Report', 20, 282);
  pdf.text(`Page 5`, pageWidth - 30, 282);
  
  // ============= PAGE 6: RECOMMENDATIONS =============
  pdf.addPage();
  
  // Page header
  pdf.setFillColor(212, 175, 55);
  pdf.rect(0, 0, pageWidth, 12, 'F');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('VOLTAXE SECURITY REPORT', 15, 8);
  
  yPos = 25;
  
  // Recommendations
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(212, 175, 55);
  pdf.text('Security Recommendations', 20, yPos);
  
  yPos += 15;
  
  // Immediate Actions
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(220, 53, 69);
  pdf.text('[!] Immediate Actions Required', 20, yPos);
  
  yPos += 8;
  
  const immediateActions = [];
  if (data.rootkits.length > 0) {
    immediateActions.push('[!] URGENT: Investigate and remediate all rootkit detections immediately');
    immediateActions.push('[!] Isolate affected systems from the network pending investigation');
    immediateActions.push('[!] Conduct full forensic analysis of compromised endpoints');
  }
  if (data.malware.filter(m => m.isMalicious).length > 0) {
    immediateActions.push('[!] Quarantine and remove all detected malware files');
    immediateActions.push('[!] Perform full system scans on all endpoints');
  }
  if (data.vulnerabilities.length > 0) {
    immediateActions.push('[!] Patch all identified CVEs on affected systems');
    immediateActions.push('[!] Prioritize patching based on CVE severity scores');
  }
  immediateActions.push('[!] Review and investigate all critical security alerts');
  immediateActions.push('[!] Implement additional monitoring for high-risk endpoints');
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  
  immediateActions.forEach(action => {
    if (yPos > 260) {
      pdf.addPage();
      // Page header
      pdf.setFillColor(212, 175, 55);
      pdf.rect(0, 0, pageWidth, 12, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('VOLTAXE SECURITY REPORT', 15, 8);
      yPos = 25;
    }
    
    const lines = pdf.splitTextToSize(action, pageWidth - 55);
    lines.forEach((line: string) => {
      pdf.text(line, 30, yPos);
      yPos += 5;
    });
    yPos += 2;
  });
  
  yPos += 8;
  
  // Strategic Improvements
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(23, 162, 184);
  pdf.text('[*] Strategic Security Improvements', 20, yPos);
  
  yPos += 8;
  
  const strategicActions = [
    '[+] Establish automated patch management procedures',
    '[+] Implement network segmentation for critical systems',
    '[+] Deploy additional endpoint detection and response (EDR) capabilities',
    '[+] Schedule regular penetration testing assessments',
    '[+] Conduct security awareness training for system administrators',
    '[+] Develop and test incident response procedures'
  ];
  
  if (data.rootkits.length > 0) {
    strategicActions.push('[+] Implement integrity monitoring and advanced rootkit detection tools');
  }
  if (data.malware.filter(m => m.isMalicious).length > 0) {
    strategicActions.push('[+] Enhance anti-malware protection and real-time scanning');
  }
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  
  strategicActions.forEach(action => {
    if (yPos > 260) {
      pdf.addPage();
      // Page header
      pdf.setFillColor(212, 175, 55);
      pdf.rect(0, 0, pageWidth, 12, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('VOLTAXE SECURITY REPORT', 15, 8);
      yPos = 25;
    }
    
    const lines = pdf.splitTextToSize(action, pageWidth - 55);
    lines.forEach((line: string) => {
      pdf.text(line, 30, yPos);
      yPos += 5;
    });
    yPos += 2;
  });
  
  // Final footer
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.3);
  pdf.line(20, 275, pageWidth - 20, 275);
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Voltaxe Clarity Hub - Confidential Security Report', 20, 282);
  const pageCount = pdf.getNumberOfPages();
  pdf.text(`Page ${pageCount}`, pageWidth - 30, 282);
  
  // Generate filename and save
  const timestamp = data.generatedAt.toISOString().split('T')[0];
  const reportTypeSlug = data.reportType.replace(/-/g, '_');
  const filename = `voltaxe_${reportTypeSlug}_${timestamp}.pdf`;
  
  pdf.save(filename);
};

// ============= VULNERABILITY ASSESSMENT REPORT (FOCUSED ON CVEs) =============
const generateVulnerabilityReportPDF = (data: ReportData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Cover Page
  pdf.setFillColor(25, 35, 65);
  pdf.rect(0, 0, pageWidth, 45, 'F');
  pdf.setFillColor(212, 175, 55);
  pdf.rect(0, 42, pageWidth, 3, 'F');
  
  pdf.setFillColor(212, 175, 55);
  pdf.roundedRect(12, 12, 22, 22, 2, 2, 'F');
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 35, 65);
  pdf.text('SHIELD', 23, 26, { align: 'center' });
  
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('VOLTAXE', 42, 26);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(200, 200, 200);
  pdf.text('VULNERABILITY ASSESSMENT', 42, 34);
  
  // Title
  pdf.setFontSize(26);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 35, 65);
  const titleWidth = pdf.getTextWidth('Vulnerability Assessment Report');
  pdf.text('Vulnerability Assessment Report', (pageWidth - titleWidth) / 2, 70);
  
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(2);
  pdf.line(50, 75, pageWidth - 50, 75);
  
  // Metadata
  const timeRangeText = {
    '1d': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days'
  }[data.timeRange] || 'Custom Range';
  
  pdf.setFillColor(250, 252, 255);
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.8);
  pdf.roundedRect(25, 90, pageWidth - 50, 50, 4, 4, 'FD');
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(80, 80, 80);
  pdf.text('Report Period:', 40, 100);
  pdf.text('Generated:', 40, 110);
  pdf.text('Focus:', 40, 120);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.text(timeRangeText, 80, 100);
  pdf.text(data.generatedAt.toLocaleString(), 80, 110);
  pdf.text('CVE Detection & Patch Management', 80, 120);
  
  // Executive Summary
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 193, 7);
  pdf.text('Vulnerability Overview', 20, 155);
  
  const totalVulns = data.vulnerabilities.length;
  const criticalVulns = data.vulnerabilities.filter(v => v.reason?.includes('Critical') || v.cve?.includes('CRITICAL')).length;
  const highVulns = data.vulnerabilities.filter(v => v.reason?.includes('High')).length;
  
  // Metrics
  const metricsY = 175;
  const cardWidth = 60;
  const cardSpacing = 3;
  
  // Total Vulnerabilities
  let cardX = 15;
  pdf.setFillColor(0, 0, 0, 0.1);
  pdf.roundedRect(cardX + 1, metricsY + 1, cardWidth, 38, 4, 4, 'F');
  pdf.setFillColor(255, 193, 7);
  pdf.roundedRect(cardX, metricsY, cardWidth, 38, 4, 4, 'F');
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(String(totalVulns), cardX + cardWidth/2, metricsY + 20, { align: 'center' });
  pdf.setFontSize(8);
  pdf.text('TOTAL CVEs', cardX + cardWidth/2, metricsY + 30, { align: 'center' });
  
  // Critical
  cardX += cardWidth + cardSpacing;
  pdf.setFillColor(0, 0, 0, 0.1);
  pdf.roundedRect(cardX + 1, metricsY + 1, cardWidth, 38, 4, 4, 'F');
  pdf.setFillColor(220, 53, 69);
  pdf.roundedRect(cardX, metricsY, cardWidth, 38, 4, 4, 'F');
  pdf.setFontSize(28);
  pdf.setTextColor(255, 255, 255);
  pdf.text(String(criticalVulns), cardX + cardWidth/2, metricsY + 20, { align: 'center' });
  pdf.setFontSize(8);
  pdf.text('CRITICAL', cardX + cardWidth/2, metricsY + 30, { align: 'center' });
  
  // High
  cardX += cardWidth + cardSpacing;
  pdf.setFillColor(0, 0, 0, 0.1);
  pdf.roundedRect(cardX + 1, metricsY + 1, cardWidth, 38, 4, 4, 'F');
  pdf.setFillColor(255, 152, 0);
  pdf.roundedRect(cardX, metricsY, cardWidth, 38, 4, 4, 'F');
  pdf.setFontSize(28);
  pdf.setTextColor(255, 255, 255);
  pdf.text(String(highVulns), cardX + cardWidth/2, metricsY + 20, { align: 'center' });
  pdf.setFontSize(8);
  pdf.text('HIGH', cardX + cardWidth/2, metricsY + 30, { align: 'center' });
  
  // Patch Priority
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(220, 53, 69);
  pdf.text('[!] Patching Priority: IMMEDIATE', 20, 230);
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('All identified vulnerabilities require immediate attention and remediation.', 20, 240, { maxWidth: 170 });
  
  // Footer
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.3);
  pdf.line(20, 275, pageWidth - 20, 275);
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Voltaxe Vulnerability Assessment Report', 20, 282);
  pdf.text('Page 1', pageWidth - 30, 282);
  
  // Page 2+: Detailed CVE Listings
  pdf.addPage();
  pdf.setFillColor(212, 175, 55);
  pdf.rect(0, 0, pageWidth, 12, 'F');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('VULNERABILITY ASSESSMENT REPORT', 15, 8);
  
  let yPos = 25;
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 193, 7);
  pdf.text('Detailed CVE Analysis', 20, yPos);
  yPos += 15;
  
  if (data.vulnerabilities.length > 0) {
    data.vulnerabilities.forEach((vuln) => {
      if (yPos > 250) {
        pdf.addPage();
        pdf.setFillColor(212, 175, 55);
        pdf.rect(0, 0, pageWidth, 12, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text('VULNERABILITY ASSESSMENT REPORT', 15, 8);
        yPos = 25;
      }
      
      // CVE Card
      pdf.setFillColor(255, 249, 235);
      pdf.setDrawColor(255, 193, 7);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(20, yPos, pageWidth - 40, 32, 2, 2, 'FD');
      
      // CVE Badge
      pdf.setFillColor(220, 53, 69);
      pdf.roundedRect(25, yPos + 4, 50, 8, 1, 1, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(vuln.cve, 50, yPos + 10, { align: 'center' });
      
      // Hostname
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40, 40, 40);
      pdf.text(`Host: ${vuln.hostname}`, 80, yPos + 10);
      
      // Software
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Affected: ${vuln.software} ${vuln.version}`, 25, yPos + 18);
      
      // Description
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      const reason = vuln.reason.length > 100 ? vuln.reason.substring(0, 97) + '...' : vuln.reason;
      pdf.text(reason, 25, yPos + 24, { maxWidth: pageWidth - 50 });
      
      yPos += 36;
    });
  } else {
    pdf.setFillColor(236, 253, 245);
    pdf.setDrawColor(40, 167, 69);
    pdf.roundedRect(20, yPos, pageWidth - 40, 15, 2, 2, 'FD');
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(40, 167, 69);
    pdf.text('[OK] No vulnerabilities detected', 25, yPos + 10);
  }
  
  // Final page footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(212, 175, 55);
    pdf.setLineWidth(0.3);
    pdf.line(20, 275, pageWidth - 20, 275);
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text('Voltaxe Vulnerability Assessment Report', 20, 282);
    pdf.text(`Page ${i}`, pageWidth - 30, 282);
  }
  
  const timestamp = data.generatedAt.toISOString().split('T')[0];
  pdf.save(`voltaxe_vulnerability_assessment_${timestamp}.pdf`);
};

// ============= ALERTS ANALYSIS REPORT (FOCUSED ON SECURITY ALERTS) =============
const generateAlertsAnalysisPDF = (data: ReportData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Cover Page
  pdf.setFillColor(25, 35, 65);
  pdf.rect(0, 0, pageWidth, 45, 'F');
  pdf.setFillColor(212, 175, 55);
  pdf.rect(0, 42, pageWidth, 3, 'F');
  
  pdf.setFillColor(212, 175, 55);
  pdf.roundedRect(12, 12, 22, 22, 2, 2, 'F');
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 35, 65);
  pdf.text('SHIELD', 23, 26, { align: 'center' });
  
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('VOLTAXE', 42, 26);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(200, 200, 200);
  pdf.text('SECURITY ALERTS ANALYSIS', 42, 34);
  
  // Title
  pdf.setFontSize(26);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 35, 65);
  const titleWidth = pdf.getTextWidth('Security Alerts Analysis');
  pdf.text('Security Alerts Analysis', (pageWidth - titleWidth) / 2, 70);
  
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(2);
  pdf.line(50, 75, pageWidth - 50, 75);
  
  // Metadata
  const timeRangeText = {
    '1d': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days'
  }[data.timeRange] || 'Custom Range';
  
  pdf.setFillColor(250, 252, 255);
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.8);
  pdf.roundedRect(25, 90, pageWidth - 50, 50, 4, 4, 'FD');
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(80, 80, 80);
  pdf.text('Report Period:', 40, 100);
  pdf.text('Generated:', 40, 110);
  pdf.text('Focus:', 40, 120);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.text(timeRangeText, 80, 100);
  pdf.text(data.generatedAt.toLocaleString(), 80, 110);
  pdf.text('Alert Trends & Incident Response', 80, 120);
  
  // Alert Statistics
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(220, 53, 69);
  pdf.text('Alert Overview', 20, 155);
  
  const criticalAlerts = data.alerts.filter(a => a.type === 'Critical').length;
  const warningAlerts = data.alerts.filter(a => a.type === 'Warning').length;
  const totalAlerts = data.alerts.length;
  const rootkitAlerts = data.rootkits.length;
  
  // Metrics
  const metricsY = 175;
  const cardWidth = 46;
  const cardSpacing = 2;
  
  // Critical
  let cardX = 15;
  pdf.setFillColor(0, 0, 0, 0.1);
  pdf.roundedRect(cardX + 1, metricsY + 1, cardWidth, 38, 4, 4, 'F');
  pdf.setFillColor(220, 53, 69);
  pdf.roundedRect(cardX, metricsY, cardWidth, 38, 4, 4, 'F');
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(String(criticalAlerts), cardX + cardWidth/2, metricsY + 20, { align: 'center' });
  pdf.setFontSize(8);
  pdf.text('CRITICAL', cardX + cardWidth/2, metricsY + 30, { align: 'center' });
  
  // Warning
  cardX += cardWidth + cardSpacing;
  pdf.setFillColor(0, 0, 0, 0.1);
  pdf.roundedRect(cardX + 1, metricsY + 1, cardWidth, 38, 4, 4, 'F');
  pdf.setFillColor(255, 193, 7);
  pdf.roundedRect(cardX, metricsY, cardWidth, 38, 4, 4, 'F');
  pdf.setFontSize(28);
  pdf.setTextColor(255, 255, 255);
  pdf.text(String(warningAlerts), cardX + cardWidth/2, metricsY + 20, { align: 'center' });
  pdf.setFontSize(8);
  pdf.text('WARNING', cardX + cardWidth/2, metricsY + 30, { align: 'center' });
  
  // Total
  cardX += cardWidth + cardSpacing;
  pdf.setFillColor(0, 0, 0, 0.1);
  pdf.roundedRect(cardX + 1, metricsY + 1, cardWidth, 38, 4, 4, 'F');
  pdf.setFillColor(23, 162, 184);
  pdf.roundedRect(cardX, metricsY, cardWidth, 38, 4, 4, 'F');
  pdf.setFontSize(28);
  pdf.setTextColor(255, 255, 255);
  pdf.text(String(totalAlerts), cardX + cardWidth/2, metricsY + 20, { align: 'center' });
  pdf.setFontSize(8);
  pdf.text('TOTAL', cardX + cardWidth/2, metricsY + 30, { align: 'center' });
  
  // Rootkits
  cardX += cardWidth + cardSpacing;
  pdf.setFillColor(0, 0, 0, 0.1);
  pdf.roundedRect(cardX + 1, metricsY + 1, cardWidth, 38, 4, 4, 'F');
  pdf.setFillColor(111, 66, 193);
  pdf.roundedRect(cardX, metricsY, cardWidth, 38, 4, 4, 'F');
  pdf.setFontSize(28);
  pdf.setTextColor(255, 255, 255);
  pdf.text(String(rootkitAlerts), cardX + cardWidth/2, metricsY + 20, { align: 'center' });
  pdf.setFontSize(8);
  pdf.text('ROOTKITS', cardX + cardWidth/2, metricsY + 30, { align: 'center' });
  
  // Alert Trend
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(220, 53, 69);
  const alertTrend = criticalAlerts > 5 ? 'HIGH ACTIVITY' : criticalAlerts > 0 ? 'MODERATE' : 'LOW';
  pdf.text(`Alert Activity: ${alertTrend}`, 20, 230);
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Continuous monitoring detected the above security events requiring investigation.', 20, 240, { maxWidth: 170 });
  
  // Footer
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.3);
  pdf.line(20, 275, pageWidth - 20, 275);
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Voltaxe Security Alerts Analysis', 20, 282);
  pdf.text('Page 1', pageWidth - 30, 282);
  
  // Page 2+: Detailed Alert Listings
  pdf.addPage();
  pdf.setFillColor(212, 175, 55);
  pdf.rect(0, 0, pageWidth, 12, 'F');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('SECURITY ALERTS ANALYSIS', 15, 8);
  
  let yPos = 25;
  
  // Critical Alerts First
  if (criticalAlerts > 0) {
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(220, 53, 69);
    pdf.text('[!] Critical Alerts', 20, yPos);
    yPos += 12;
    
    data.alerts.filter(a => a.type === 'Critical').forEach(alert => {
      if (yPos > 250) {
        pdf.addPage();
        pdf.setFillColor(212, 175, 55);
        pdf.rect(0, 0, pageWidth, 12, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text('SECURITY ALERTS ANALYSIS', 15, 8);
        yPos = 25;
      }
      
      // Alert Card
      pdf.setFillColor(254, 242, 242);
      pdf.setDrawColor(220, 53, 69);
      pdf.setLineWidth(0.8);
      pdf.roundedRect(20, yPos, pageWidth - 40, 18, 2, 2, 'FD');
      
      // Type Badge
      pdf.setFillColor(220, 53, 69);
      pdf.roundedRect(25, yPos + 4, 28, 7, 1, 1, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('CRITICAL', 39, yPos + 9, { align: 'center' });
      
      // Description
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      const desc = alert.description.length > 85 ? alert.description.substring(0, 82) + '...' : alert.description;
      pdf.text(desc, 58, yPos + 9);
      
      // Timestamp
      pdf.setFontSize(7);
      pdf.setTextColor(120, 120, 120);
      pdf.text(alert.timestamp.toLocaleString(), 25, yPos + 15);
      
      yPos += 22;
    });
  }
  
  // Rootkit Alerts
  if (rootkitAlerts > 0) {
    yPos += 5;
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(111, 66, 193);
    pdf.text('[!] Rootkit Detections', 20, yPos);
    yPos += 12;
    
    data.rootkits.forEach(rootkit => {
      if (yPos > 250) {
        pdf.addPage();
        pdf.setFillColor(212, 175, 55);
        pdf.rect(0, 0, pageWidth, 12, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text('SECURITY ALERTS ANALYSIS', 15, 8);
        yPos = 25;
      }
      
      pdf.setFillColor(255, 245, 255);
      pdf.setDrawColor(111, 66, 193);
      pdf.setLineWidth(0.8);
      pdf.roundedRect(20, yPos, pageWidth - 40, 15, 2, 2, 'FD');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(111, 66, 193);
      pdf.text(`Host: ${rootkit.hostname}`, 25, yPos + 7);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Method: ${rootkit.detectionMethod}`, 25, yPos + 12);
      
      yPos += 18;
    });
  }
  
  // Warning Alerts
  if (warningAlerts > 0) {
    yPos += 5;
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 193, 7);
    pdf.text('[!] Warning Alerts', 20, yPos);
    yPos += 12;
    
    data.alerts.filter(a => a.type === 'Warning').slice(0, 10).forEach(alert => {
      if (yPos > 250) {
        pdf.addPage();
        pdf.setFillColor(212, 175, 55);
        pdf.rect(0, 0, pageWidth, 12, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text('SECURITY ALERTS ANALYSIS', 15, 8);
        yPos = 25;
      }
      
      pdf.setFillColor(255, 251, 235);
      pdf.setDrawColor(255, 193, 7);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(20, yPos, pageWidth - 40, 15, 2, 2, 'FD');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      const desc = alert.description.length > 80 ? alert.description.substring(0, 77) + '...' : alert.description;
      pdf.text(desc, 25, yPos + 9);
      
      yPos += 18;
    });
  }
  
  // Final page footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(212, 175, 55);
    pdf.setLineWidth(0.3);
    pdf.line(20, 275, pageWidth - 20, 275);
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text('Voltaxe Security Alerts Analysis', 20, 282);
    pdf.text(`Page ${i}`, pageWidth - 30, 282);
  }
  
  const timestamp = data.generatedAt.toISOString().split('T')[0];
  pdf.save(`voltaxe_alerts_analysis_${timestamp}.pdf`);
};

// ============= COMPLIANCE REPORT (FOCUSED ON COMPLIANCE STATUS) =============
const generateComplianceReportPDF = (data: ReportData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Cover Page
  pdf.setFillColor(25, 35, 65);
  pdf.rect(0, 0, pageWidth, 45, 'F');
  pdf.setFillColor(212, 175, 55);
  pdf.rect(0, 42, pageWidth, 3, 'F');
  
  pdf.setFillColor(212, 175, 55);
  pdf.roundedRect(12, 12, 22, 22, 2, 2, 'F');
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 35, 65);
  pdf.text('SHIELD', 23, 26, { align: 'center' });
  
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('VOLTAXE', 42, 26);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(200, 200, 200);
  pdf.text('COMPLIANCE STATUS REPORT', 42, 34);
  
  // Title
  pdf.setFontSize(26);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 35, 65);
  const titleWidth = pdf.getTextWidth('Compliance Status Report');
  pdf.text('Compliance Status Report', (pageWidth - titleWidth) / 2, 70);
  
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(2);
  pdf.line(50, 75, pageWidth - 50, 75);
  
  // Metadata
  const timeRangeText = {
    '1d': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days'
  }[data.timeRange] || 'Custom Range';
  
  pdf.setFillColor(250, 252, 255);
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.8);
  pdf.roundedRect(25, 90, pageWidth - 50, 50, 4, 4, 'FD');
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(80, 80, 80);
  pdf.text('Report Period:', 40, 100);
  pdf.text('Generated:', 40, 110);
  pdf.text('Standards:', 40, 120);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.text(timeRangeText, 80, 100);
  pdf.text(data.generatedAt.toLocaleString(), 80, 110);
  pdf.text('Security Best Practices & Industry Standards', 80, 120);
  
  // Compliance Score
  const totalVulns = data.vulnerabilities.length;
  const rootkitCount = data.rootkits.length;
  const malwareCount = data.malware.filter(m => m.isMalicious).length;
  const criticalAlerts = data.alerts.filter(a => a.type === 'Critical').length;
  
  // Calculate compliance score (100 - penalties)
  let complianceScore = 100;
  complianceScore -= totalVulns * 5; // -5 per vulnerability
  complianceScore -= rootkitCount * 20; // -20 per rootkit
  complianceScore -= malwareCount * 10; // -10 per malware
  complianceScore -= criticalAlerts * 8; // -8 per critical alert
  complianceScore = Math.max(0, Math.min(100, complianceScore));
  
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(23, 162, 184);
  pdf.text('Compliance Score', 20, 155);
  
  // Score Display
  const scoreColor: [number, number, number] = complianceScore >= 80 ? [40, 167, 69] :
                       complianceScore >= 60 ? [255, 193, 7] : [220, 53, 69];
  
  pdf.setFillColor(0, 0, 0, 0.1);
  pdf.roundedRect(21, 166, 80, 45, 4, 4, 'F');
  pdf.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  pdf.roundedRect(20, 165, 80, 45, 4, 4, 'F');
  
  pdf.setFontSize(48);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(String(complianceScore), 60, 195, { align: 'center' });
  pdf.setFontSize(12);
  pdf.text('/100', 60, 205, { align: 'center' });
  
  // Status Badge
  const statusText = complianceScore >= 80 ? 'COMPLIANT' :
                     complianceScore >= 60 ? 'NEEDS IMPROVEMENT' : 'NON-COMPLIANT';
  
  pdf.setFillColor(250, 252, 255);
  pdf.setDrawColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  pdf.setLineWidth(1.5);
  pdf.roundedRect(110, 165, 80, 20, 3, 3, 'FD');
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  pdf.text(statusText, 150, 178, { align: 'center' });
  
  // Compliance Factors
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(80, 80, 80);
  pdf.text('Contributing Factors:', 110, 195);
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  let factorY = 202;
  pdf.text(`[*] ${totalVulns} Vulnerabilities (-${totalVulns * 5} pts)`, 110, factorY);
  factorY += 6;
  pdf.text(`[*] ${rootkitCount} Rootkits (-${rootkitCount * 20} pts)`, 110, factorY);
  factorY += 6;
  pdf.text(`[*] ${malwareCount} Malware (-${malwareCount * 10} pts)`, 110, factorY);
  factorY += 6;
  pdf.text(`[*] ${criticalAlerts} Critical Alerts (-${criticalAlerts * 8} pts)`, 110, factorY);
  
  // Footer
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.3);
  pdf.line(20, 275, pageWidth - 20, 275);
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Voltaxe Compliance Status Report', 20, 282);
  pdf.text('Page 1', pageWidth - 30, 282);
  
  // Page 2: Compliance Requirements
  pdf.addPage();
  pdf.setFillColor(212, 175, 55);
  pdf.rect(0, 0, pageWidth, 12, 'F');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('COMPLIANCE STATUS REPORT', 15, 8);
  
  let yPos = 25;
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(23, 162, 184);
  pdf.text('Security Requirements Assessment', 20, yPos);
  yPos += 15;
  
  // Requirement Checks
  const requirements = [
    {
      name: 'Vulnerability Management',
      status: totalVulns === 0,
      description: 'All systems must be free of known vulnerabilities'
    },
    {
      name: 'Malware Protection',
      status: malwareCount === 0,
      description: 'No malware detections on monitored systems'
    },
    {
      name: 'Rootkit Detection',
      status: rootkitCount === 0,
      description: 'System integrity maintained, no rootkit activity'
    },
    {
      name: 'Critical Alert Response',
      status: criticalAlerts === 0,
      description: 'All critical security alerts resolved'
    },
    {
      name: 'Continuous Monitoring',
      status: data.snapshots.length > 0,
      description: 'Active monitoring of all endpoints'
    },
    {
      name: 'Incident Documentation',
      status: data.events.length >= 0,
      description: 'Security events logged and tracked'
    }
  ];
  
  requirements.forEach(req => {
    const reqColor: [number, number, number] = req.status ? [40, 167, 69] : [220, 53, 69];
    const reqIcon = req.status ? '[OK]' : '[X]';
    
    pdf.setFillColor(req.status ? 236 : 254, req.status ? 253 : 242, req.status ? 245 : 242);
    pdf.setDrawColor(reqColor[0], reqColor[1], reqColor[2]);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(20, yPos, pageWidth - 40, 20, 2, 2, 'FD');
    
    // Status Icon
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(reqColor[0], reqColor[1], reqColor[2]);
    pdf.text(reqIcon, 25, yPos + 8);
    
    // Requirement Name
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(40, 40, 40);
    pdf.text(req.name, 38, yPos + 8);
    
    // Description
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(req.description, 25, yPos + 15);
    
    yPos += 24;
    
    if (yPos > 250) {
      pdf.addPage();
      pdf.setFillColor(212, 175, 55);
      pdf.rect(0, 0, pageWidth, 12, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('COMPLIANCE STATUS REPORT', 15, 8);
      yPos = 25;
    }
  });
  
  // Page 3: Recommendations
  pdf.addPage();
  pdf.setFillColor(212, 175, 55);
  pdf.rect(0, 0, pageWidth, 12, 'F');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('COMPLIANCE STATUS REPORT', 15, 8);
  
  yPos = 25;
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(212, 175, 55);
  pdf.text('Compliance Recommendations', 20, yPos);
  yPos += 15;
  
  const recommendations = [
    '[+] Implement automated vulnerability scanning and patch management',
    '[+] Establish regular security audit schedules',
    '[+] Deploy endpoint detection and response (EDR) solutions',
    '[+] Create and maintain incident response procedures',
    '[+] Conduct regular security awareness training',
    '[+] Implement multi-factor authentication (MFA)',
    '[+] Maintain comprehensive security event logging',
    '[+] Perform regular backup and disaster recovery testing',
    '[+] Establish network segmentation for critical systems',
    '[+] Conduct periodic penetration testing and security assessments'
  ];
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  
  recommendations.forEach(rec => {
    const lines = pdf.splitTextToSize(rec, pageWidth - 55);
    lines.forEach((line: string) => {
      if (yPos > 265) {
        pdf.addPage();
        pdf.setFillColor(212, 175, 55);
        pdf.rect(0, 0, pageWidth, 12, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text('COMPLIANCE STATUS REPORT', 15, 8);
        yPos = 25;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(60, 60, 60);
      }
      pdf.text(line, 30, yPos);
      yPos += 5;
    });
    yPos += 2;
  });
  
  // Final page footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(212, 175, 55);
    pdf.setLineWidth(0.3);
    pdf.line(20, 275, pageWidth - 20, 275);
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text('Voltaxe Compliance Status Report', 20, 282);
    pdf.text(`Page ${i}`, pageWidth - 30, 282);
  }
  
  const timestamp = data.generatedAt.toISOString().split('T')[0];
  pdf.save(`voltaxe_compliance_report_${timestamp}.pdf`);
};

// Legacy HTML report generator (disabled - using professional 6-page PDF design instead)
/* const generateHTMLReport = (data: ReportData): string => {
  const timeRangeText = {
    '1d': 'Last 24 Hours',
    '7d': 'Last 7 Days', 
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days'
  }[data.timeRange] || 'Custom Range';

  const reportTypeText = {
    'security-summary': 'Security Summary Report',
    'vulnerability-report': 'Vulnerability Assessment Report',
    'alerts-analysis': 'Security Alerts Analysis',
    'compliance-report': 'Compliance Status Report'
  }[data.reportType] || 'Security Report';

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: white; padding: 30px;">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
          padding: 30px;
        }
        .header {
          border-bottom: 3px solid #D4AF37;
          padding-bottom: 20px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #D4AF37;
        }
        .report-info {
          text-align: right;
          font-size: 14px;
          color: #666;
        }
        h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
        h2 { color: #D4AF37; font-size: 20px; margin: 20px 0 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        h3 { color: #555; font-size: 16px; margin: 15px 0 8px; }
        .summary-cards {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin: 20px 0;
        }
        .card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          flex: 1;
          min-width: 150px;
        }
        .card.critical { border-left: 4px solid #dc3545; }
        .card.warning { border-left: 4px solid #ffc107; }
        .card.info { border-left: 4px solid #17a2b8; }
        .card-value {
          font-size: 32px;
          font-weight: bold;
          color: #D4AF37;
          display: block;
        }
        .card-label {
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #555;
        }
        tr:nth-child(even) { background-color: #f8f9fa; }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .status-critical { color: #dc3545; font-weight: bold; }
        .status-warning { color: #ffc107; font-weight: bold; }
        .status-good { color: #28a745; font-weight: bold; }
      </style>
      <div class="header">
        <div>
          <div class="logo">? VOLTAXE</div>
          <div style="font-size: 14px; color: #666;">Security Monitoring Platform</div>
        </div>
        <div class="report-info">
          <div><strong>${reportTypeText}</strong></div>
          <div>Period: ${timeRangeText}</div>
          <div>Generated: ${data.generatedAt.toLocaleString()}</div>
        </div>
      </div>

      <h1>Executive Summary</h1>
      <p>This report provides a comprehensive overview of the security posture for the specified time period. 
      The analysis includes vulnerability assessments, security alerts, and system monitoring data.</p>

      <div class="summary-cards">
        <div class="card critical">
          <span class="card-value">${data.snapshots.reduce((sum, s) => sum + s.vulnerabilities, 0)}</span>
          <div class="card-label">Total Vulnerabilities</div>
        </div>
        <div class="card warning">
          <span class="card-value">${data.alerts.length}</span>
          <div class="card-label">Security Alerts</div>
        </div>
        <div class="card info">
          <span class="card-value">${data.snapshots.length}</span>
          <div class="card-label">Monitored Endpoints</div>
        </div>
        <div class="card info">
          <span class="card-value">${data.events.length}</span>
          <div class="card-label">Security Events</div>
        </div>
        <div class="card critical">
          <span class="card-value">${data.malware.filter(m => m.isMalicious).length}</span>
          <div class="card-label">Malware Detected</div>
        </div>
        <div class="card critical">
          <span class="card-value">${data.rootkits.length}</span>
          <div class="card-label">Rootkit Alerts</div>
        </div>
      </div>

      <h2>Security Posture Assessment</h2>
      <p>Based on the current analysis, the overall security posture is <span class="status-warning">NEEDS ATTENTION</span>. 
      Critical vulnerabilities have been identified and require immediate remediation.</p>

      <h2>Endpoint Vulnerability Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Hostname</th>
            <th>Vulnerabilities Found</th>
            <th>Last Scan</th>
            <th>Risk Level</th>
          </tr>
        </thead>
        <tbody>
          ${data.snapshots.map(snapshot => `
            <tr>
              <td><strong>${snapshot.hostname}</strong></td>
              <td>${snapshot.vulnerabilities}</td>
              <td>${snapshot.lastScan.toLocaleDateString()}</td>
              <td class="${snapshot.vulnerabilities > 2 ? 'status-critical' : snapshot.vulnerabilities > 0 ? 'status-warning' : 'status-good'}">
                ${snapshot.vulnerabilities > 2 ? 'High' : snapshot.vulnerabilities > 0 ? 'Medium' : 'Low'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>Recent Security Alerts</h2>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Description</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          ${data.alerts.map(alert => `
            <tr>
              <td><span class="${alert.type === 'Critical' ? 'status-critical' : 'status-warning'}">${alert.type}</span></td>
              <td>${alert.description}</td>
              <td>${alert.timestamp.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${data.malware.filter(m => m.isMalicious).length > 0 ? `
      <h2>? Malware Detections</h2>
      <table>
        <thead>
          <tr>
            <th>File Name</th>
            <th>Threat Level</th>
            <th>Signatures Matched</th>
            <th>Scan Time</th>
          </tr>
        </thead>
        <tbody>
          ${data.malware.filter(m => m.isMalicious).map(malware => `
            <tr>
              <td><strong>${malware.fileName}</strong></td>
              <td><span class="status-critical">${malware.threatLevel}</span></td>
              <td>${malware.matches.join(', ')}</td>
              <td>${malware.scanTime.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      ${data.vulnerabilities.length > 0 ? `
      <h2>? Vulnerability Details</h2>
      <table>
        <thead>
          <tr>
            <th>Host</th>
            <th>Software</th>
            <th>Version</th>
            <th>CVE</th>
            <th>Description</th>
            <th>Detected</th>
          </tr>
        </thead>
        <tbody>
          ${data.vulnerabilities.map(vuln => `
            <tr>
              <td><strong>${vuln.hostname}</strong></td>
              <td>${vuln.software}</td>
              <td>${vuln.version}</td>
              <td><span class="status-critical">${vuln.cve}</span></td>
              <td>${vuln.reason}</td>
              <td>${vuln.timestamp.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      ${data.rootkits.length > 0 ? `
      <h2 style="color: #dc3545;">?? CRITICAL: ROOTKIT ALERTS</h2>
      <div style="background: #fff5f5; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
        <p style="color: #dc3545; font-weight: bold; margin-bottom: 10px;">? IMMEDIATE ACTION REQUIRED</p>
        <p>Rootkit detections indicate potential system compromise. These are the highest severity threats and require immediate investigation and remediation.</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Host</th>
            <th>Detection Method</th>
            <th>Recommendation</th>
            <th>Detected</th>
          </tr>
        </thead>
        <tbody>
          ${data.rootkits.map(rootkit => `
            <tr style="background: #fff5f5;">
              <td><strong style="color: #dc3545;">${rootkit.hostname}</strong></td>
              <td>${rootkit.detectionMethod}</td>
              <td><span class="status-critical">${rootkit.recommendation}</span></td>
              <td>${rootkit.timestamp.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      <h2>Recommendations</h2>
      <h3>Immediate Actions Required:</h3>
      <ul>
        ${data.rootkits.length > 0 ? '<li><strong style="color: #dc3545;">? URGENT: Investigate and remediate all rootkit detections immediately</strong></li>' : ''}
        ${data.malware.filter(m => m.isMalicious).length > 0 ? '<li>Quarantine and remove all detected malware files</li>' : ''}
        ${data.vulnerabilities.length > 0 ? '<li>Patch all identified CVEs on affected systems</li>' : ''}
        <li>Review and investigate suspicious process activities</li>
        <li>Implement additional monitoring for high-risk endpoints</li>
        <li>Conduct security awareness training for system administrators</li>
      </ul>

      <h3>Strategic Improvements:</h3>
      <ul>
        <li>Establish automated patch management procedures</li>
        <li>Implement network segmentation for critical systems</li>
        <li>Deploy additional endpoint detection and response (EDR) capabilities</li>
        <li>Schedule regular penetration testing assessments</li>
        ${data.rootkits.length > 0 ? '<li><strong>Implement integrity monitoring and rootkit detection tools</strong></li>' : ''}
        ${data.malware.filter(m => m.isMalicious).length > 0 ? '<li>Enhance anti-malware protection and real-time scanning</li>' : ''}
      </ul>

      <div class="footer">
        <p><strong>Voltaxe Clarity Hub Security Report</strong> | Generated ${data.generatedAt.toLocaleString()}</p>
        <p>This report is confidential and intended for authorized personnel only.</p>
      </div>
    </div>
  `;
}; */