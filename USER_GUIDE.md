# Voltaxe Clarity Hub - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Pages](#dashboard-pages)
3. [Security Features](#security-features)
4. [Management Tools](#management-tools)
5. [Common Tasks](#common-tasks)

---

## Getting Started

### Logging In
1. Navigate to the login page
2. Enter your credentials:
   - **Email**: admin@voltaxe.com (default admin)
   - **Password**: Your secure password
3. Click "Login" to access the dashboard

### Navigation
- **Sidebar**: Located on the left side, contains all main navigation links
- **Global Search**: Use the search bar at the top of the sidebar to quickly find endpoints, alerts, or incidents
- **Active Page Indicator**: The current page is highlighted in gold

---

## Dashboard Pages

### 1. Command Center (Home)
**What it does**: Main dashboard providing an overview of your entire security posture

**Key Features**:
- **CVE Statistics**: View total CVEs, critical vulnerabilities, and recent exploits
- **Quick Stats Cards**: 
  - Total Endpoints monitored
  - Active Alerts requiring attention
  - Recent Incidents detected
  - Audit Log entries
- **Recent Activity Feed**: Latest events across your infrastructure
- **Alert Summary**: Breakdown of alerts by severity (Critical, High, Medium, Low)
- **Quick Actions**: Direct links to key features

**How to Use**:
- Check this page daily for an at-a-glance view of your security status
- Click on any stat card to navigate to detailed pages
- Monitor the activity feed for unusual patterns
- Review critical alerts immediately

---

### 2. Resilience Intelligence
**What it does**: Displays resilience scores and vulnerability intelligence for your endpoints

**Key Features**:
- **Resilience Score**: Overall security health score (0-100)
- **Score Trends**: Historical resilience score over time
- **Endpoint List**: All monitored endpoints with individual resilience scores
- **Vulnerability Breakdown**: Distribution of vulnerabilities by severity
- **Risk Categories**:
  - Vulnerable Services
  - Outdated Software
  - Configuration Issues
  - Missing Patches

**How to Use**:
1. Review your overall resilience score
2. Identify endpoints with low scores (below 70)
3. Click on an endpoint to see detailed vulnerability information
4. Prioritize remediation based on severity and score impact
5. Track improvements over time using the trend graph

**Color Coding**:
- 🟢 Green (80-100): Excellent resilience
- 🟡 Yellow (60-79): Moderate risk
- 🔴 Red (0-59): Critical risk

---

### 3. Fleet Command Center
**What it does**: Centralized management console for all your endpoints

**Key Features**:
- **Endpoint Inventory**: Complete list of all monitored systems
- **Bulk Actions**: Perform actions on multiple endpoints simultaneously
- **Fleet Metrics**:
  - Total Endpoints
  - Online/Offline Status
  - Average Resilience Score
  - Active Agents
- **Filtering**: Filter by status, operating system, or risk level
- **Health Monitoring**: Real-time health status of each endpoint
- **Remote Actions**:
  - Update agent software
  - Trigger vulnerability scans
  - Collect system information
  - Restart agents

**How to Use**:
1. **View All Endpoints**: Scroll through the complete inventory
2. **Check Endpoint Health**: 
   - Green dot = Healthy
   - Red dot = Issues detected
3. **Select Multiple Endpoints**: Use checkboxes for bulk operations
4. **Execute Actions**:
   - Click "Actions" dropdown
   - Select desired action (scan, update, restart)
   - Confirm execution
5. **Add New Endpoint**: Click "+ Add Endpoint" button

---

### 4. Alerts Page
**What it does**: Displays all security alerts detected across your infrastructure

**Key Features**:
- **Alert Dashboard**: Real-time alert feed
- **Severity Filtering**: Filter by Critical, High, Medium, or Low
- **Status Management**: Track alert lifecycle (New, In Progress, Resolved)
- **Alert Details**:
  - Timestamp
  - Affected endpoint
  - Alert type and description
  - Recommended actions
- **Bulk Actions**:
  - Mark multiple alerts as acknowledged
  - Assign to team members
  - Close resolved alerts

**How to Use**:
1. **Daily Review**: Check for new alerts every morning
2. **Prioritize by Severity**: Focus on Critical and High alerts first
3. **Investigate Alerts**:
   - Click on an alert to view full details
   - Review the affected endpoint
   - Check related incidents
4. **Take Action**:
   - Acknowledge the alert
   - Assign to responsible team member
   - Add notes or comments
   - Mark as resolved when fixed
5. **Filter and Search**: Use filters to find specific alerts

**Alert Types**:
- 🔴 Critical: Immediate action required
- 🟠 High: Urgent attention needed
- 🟡 Medium: Should be addressed soon
- 🟢 Low: Informational, monitor

---

### 5. Incidents Page
**What it does**: Manage security incidents with detailed investigation workflows

**Key Features**:
- **Incident Timeline**: Chronological view of all security incidents
- **Incident Status Tracking**:
  - New: Just detected
  - Investigating: Under review
  - Contained: Threat isolated
  - Resolved: Issue fixed
- **Incident Details**:
  - MITRE ATT&CK mapping
  - Kill chain stage
  - Affected systems
  - IOCs (Indicators of Compromise)
- **Collaboration Tools**:
  - Comments and notes
  - Team member assignment
  - Related incidents linking
- **Suggested Playbooks**: Recommended response procedures
- **Export Options**: Generate incident reports (CSV/PDF)

**How to Use**:
1. **Review New Incidents**: Check for unassigned incidents daily
2. **Investigate Incident**:
   - Click to expand incident details
   - Review MITRE ATT&CK techniques
   - Check related alerts and endpoints
   - View suggested response playbooks
3. **Collaborate**:
   - Assign to team member
   - Add investigation notes
   - Link related incidents
4. **Update Status**:
   - Move through workflow: New → Investigating → Contained → Resolved
5. **Document Resolution**:
   - Add final comments
   - Export incident report
   - Archive for compliance

**Incident Severity**:
- 🔴 Critical: Active breach or major compromise
- 🟠 High: Significant security event
- 🟡 Medium: Suspicious activity detected
- 🟢 Low: Minor security event

---

### 6. Malware Scanner
**What it does**: On-demand file scanning for malware and threats using YARA rules

**Key Features**:
- **Drag-and-Drop Upload**: Easy file submission
- **File Support**:
  - All file types supported
  - Maximum file size: 1GB
- **YARA Rule Engine**: Advanced pattern matching
- **Threat Detection**:
  - Malware families
  - Suspicious patterns
  - Known threat signatures
- **Scan Results**:
  - Threat level (Clean, Suspicious, Malicious)
  - Matched YARA rules
  - File metadata
  - Hash values (MD5, SHA256)
- **Scan History**: View previous scan results

**How to Use**:
1. **Upload a File**:
   - Click the upload area or drag-and-drop
   - Select file from your computer
   - Wait for upload to complete
2. **Scanning Process**:
   - File is analyzed with YARA rules
   - Progress indicator shows scanning status
   - Results appear when complete
3. **Review Results**:
   - ✅ Clean: No threats detected
   - ⚠️ Suspicious: Potential threat indicators
   - 🚫 Malicious: Confirmed malware detected
4. **View Matched Rules**: See which YARA rules triggered
5. **Take Action**:
   - Quarantine malicious files
   - Submit suspicious files for further analysis
   - Update detection rules

**Best Practices**:
- Scan unknown files before opening
- Verify downloads from internet
- Check email attachments
- Regularly scan critical systems

---

### 7. Audit Logs
**What it does**: Comprehensive audit trail of all user actions and system events

**Key Features**:
- **Complete Activity Log**: Every action is recorded
- **User Activity Tracking**: Who did what and when
- **Filter Options**:
  - By user
  - By action type
  - By date range
  - By success/failure
- **Statistics Dashboard**:
  - Total actions
  - Success rate
  - Most active users
  - Failed login attempts
- **Export Capabilities**:
  - JSON format for analysis
  - CSV format for spreadsheets
- **Compliance Support**: Meet regulatory audit requirements

**Logged Actions**:
- User login/logout
- Configuration changes
- Endpoint modifications
- Alert acknowledgments
- Incident status updates
- Report generation
- System settings changes

**How to Use**:
1. **View Recent Activity**: See latest actions on main page
2. **Search for Specific Events**:
   - Enter search term (user email, action type)
   - Apply date filters
   - Filter by success/failure status
3. **Review Statistics**:
   - Check success rates
   - Identify most active users
   - Monitor failed login attempts
4. **Export Audit Logs**:
   - Click "Export JSON" or "Export CSV"
   - Select date range
   - Apply filters if needed
   - Download file for compliance/analysis
5. **Investigate Issues**:
   - Filter by failure status
   - Review error messages
   - Track unauthorized access attempts

**Compliance Uses**:
- SOC 2 compliance reporting
- HIPAA audit requirements
- PCI-DSS logging
- GDPR data access tracking
- ISO 27001 evidence

---

### 8. Team Management
**What it does**: Manage user accounts and access control

**Key Features**:
- **User Directory**: List of all team members
- **Role-Based Access Control (RBAC)**:
  - Admin: Full system access
  - Analyst: View and investigate
  - Viewer: Read-only access
- **User Management**:
  - Add new users
  - Edit user details
  - Deactivate accounts
  - Reset passwords
- **Access Logs**: Track user login activity
- **Team Statistics**:
  - Total users
  - Active sessions
  - Last login times

**How to Use**:
1. **Add New Team Member**:
   - Click "+ Add User"
   - Enter email and name
   - Assign role
   - Set initial password
   - Send invitation
2. **Manage Existing Users**:
   - Click on user to view details
   - Edit role or permissions
   - View activity history
   - Deactivate if needed
3. **Monitor Access**:
   - Review login times
   - Check failed login attempts
   - Monitor user activity

---

### 9. Settings
**What it does**: Configure system settings and preferences

**Key Features**:
- **General Settings**:
  - System name and description
  - Timezone configuration
  - Date/time formats
- **Security Settings**:
  - Password policies
  - Session timeout
  - Two-factor authentication
  - API key management
- **Notification Settings**:
  - Email alerts configuration
  - Webhook integrations
  - Alert thresholds
- **Scan Settings**:
  - Scan frequency
  - YARA rule updates
  - Automatic response rules
- **Integration Settings**:
  - SIEM integration
  - Ticketing system connection
  - Third-party tools

**How to Use**:
1. Navigate to Settings page
2. Select category from left menu
3. Modify desired settings
4. Click "Save Changes"
5. Verify changes take effect

---

## Security Features

### Global Search
**Location**: Top of sidebar

**What it Searches**:
- Endpoints by hostname or IP
- Alerts by keyword
- Incidents by ID or description
- CVEs by ID
- Users by email

**How to Use**:
1. Click the search icon in sidebar
2. Type your search query
3. Press Enter or click search
4. Review results
5. Click on result to navigate

---

### CVE Database
**What it does**: Track and manage Common Vulnerabilities and Exposures

**Features**:
- Complete CVE database
- Severity ratings (CVSS scores)
- Exploit availability indicators
- Patch information
- Affected products/versions
- Timeline of disclosure

**How to Use**:
1. Access from Command Center
2. Search for specific CVE by ID
3. Filter by severity or product
4. View CVE details
5. Check affected endpoints
6. Track remediation status

---

## Management Tools

### Add Endpoint
**Purpose**: Register new systems for monitoring

**Steps**:
1. Click "+ Add Endpoint" in Fleet Command Center
2. Enter endpoint details:
   - Hostname
   - IP Address
   - Operating System
   - Location/Group
3. Choose installation method:
   - **Agent Installation**: Download and install agent
   - **Agentless**: Provide SSH/WMI credentials
4. Configure monitoring options:
   - Enable vulnerability scanning
   - Set scan frequency
   - Enable real-time monitoring
5. Click "Add Endpoint"
6. Follow installation instructions
7. Verify endpoint appears in fleet

---

## Common Tasks

### Daily Security Review Checklist
1. ✅ Check Command Center dashboard for critical alerts
2. ✅ Review new incidents in Incidents page
3. ✅ Verify all endpoints are online (Fleet Command)
4. ✅ Acknowledge new alerts
5. ✅ Check resilience score trends
6. ✅ Review failed login attempts (Audit Logs)

### Weekly Tasks
1. 📊 Export audit logs for compliance
2. 🔍 Run malware scans on critical systems
3. 📈 Review resilience score improvements
4. 👥 Check team member activity
5. 🔄 Update YARA rules if needed
6. 📝 Document resolved incidents

### Monthly Tasks
1. 📑 Generate monthly security report
2. 🎯 Review and update security policies
3. 👤 Audit user access permissions
4. 🔐 Rotate API keys and credentials
5. 📊 Analyze security trends
6. 🏆 Identify areas for improvement

---

## Keyboard Shortcuts

- `Ctrl + K` or `/`: Open global search
- `Ctrl + H`: Navigate to Command Center (Home)
- `Ctrl + F`: Focus search within current page
- `Esc`: Close modals/dialogs
- `Tab`: Navigate through forms
- `Enter`: Submit forms/confirm actions

---

## Tips and Best Practices

### Alert Management
- **Prioritize by Severity**: Always address Critical and High alerts first
- **Don't Ignore Low Alerts**: They can indicate reconnaissance activity
- **Set Up Email Notifications**: Get instant alerts for critical events
- **Regular Review**: Check alerts at least twice daily

### Incident Response
- **Follow Playbooks**: Use suggested playbooks for consistent response
- **Document Everything**: Add detailed notes to incidents
- **Link Related Events**: Connect related alerts and incidents
- **Communication**: Keep team informed via comments

### Endpoint Management
- **Keep Agents Updated**: Regularly update monitoring agents
- **Monitor Health Status**: Investigate offline endpoints immediately
- **Group Logically**: Organize endpoints by function, location, or criticality
- **Regular Scans**: Schedule vulnerability scans weekly

### Audit Compliance
- **Export Regularly**: Download audit logs monthly for compliance
- **Review Access Patterns**: Monitor for unusual user activity
- **Document Changes**: Ensure all configuration changes are logged
- **Retain Records**: Keep audit logs per your compliance requirements

### Performance Optimization
- **Use Filters**: Apply filters to narrow down large datasets
- **Archive Old Data**: Remove resolved incidents older than 90 days
- **Limit Concurrent Scans**: Don't scan all endpoints simultaneously
- **Monitor Resource Usage**: Check system performance regularly

---

## Troubleshooting

### Can't Login
1. Verify email and password are correct
2. Check for CAPS LOCK
3. Clear browser cache and cookies
4. Try in private/incognito mode
5. Contact admin to reset password

### Page Not Loading
1. Refresh the page (Ctrl + Shift + R)
2. Check your internet connection
3. Verify you're logged in
4. Clear browser cache
5. Try different browser

### Token Expired Message
1. You'll be automatically redirected to login
2. Clear browser storage (F12 → Application → Clear Storage)
3. Login again with credentials
4. Session is valid for 24 hours by default

### Endpoint Not Appearing
1. Verify agent is installed correctly
2. Check endpoint has internet connectivity
3. Confirm firewall allows outbound connections
4. Check agent service is running
5. Review agent logs for errors

### Scan Not Starting
1. Verify file size is under 1GB
2. Check endpoint is online
3. Ensure you have necessary permissions
4. Wait a few minutes and retry
5. Check system resource availability

---

## Support and Additional Resources

### Getting Help
- **Documentation**: Refer to this guide
- **System Logs**: Check audit logs for error details
- **Team Lead**: Contact your security team administrator
- **Technical Support**: Email support@voltaxe.com

### Training Resources
- Video tutorials: Available in Settings → Help
- Security best practices guide
- Incident response playbooks
- MITRE ATT&CK framework reference

### Updates and Maintenance
- System updates are applied automatically
- Scheduled maintenance windows announced in advance
- Release notes available in Settings → About
- Agent updates can be deployed from Fleet Command

---

## Security Notice

⚠️ **Important Security Reminders**:
- Never share your login credentials
- Always logout when finished
- Report suspicious activity immediately
- Keep your password secure and unique
- Enable two-factor authentication if available
- Review audit logs regularly for unauthorized access
- Follow your organization's security policies

---

**Last Updated**: November 25, 2025
**Version**: 1.0.0
**Voltaxe Clarity Hub** - Advanced Cybersecurity Resilience Platform
