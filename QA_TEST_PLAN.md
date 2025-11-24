# Voltaxe Clarity Hub - QA Test Plan
## Comprehensive Functional, UI/UX, and Logic Validation

**Test Environment**: Production  
**Application Version**: 1.0.0  
**Test Date**: November 25, 2025  
**QA Lead**: [Your Name]  
**Status**: Ready for Execution

---

## Test Execution Summary Table

| Page Name | Test Case ID | Status | Observed Behavior | Criticality | Notes |
|:----------|:-------------|:-------|:------------------|:------------|:------|
| Command Center | TC-CC-001 | ⏳ Pending | - | High | Data integrity check |
| Command Center | TC-CC-002 | ⏳ Pending | - | High | Navigation verification |
| Command Center | TC-CC-003 | ⏳ Pending | - | Medium | Feed latency test |
| Command Center | TC-CC-004 | ⏳ Pending | - | High | Severity calculation |
| Resilience Intelligence | TC-RI-001 | ⏳ Pending | - | Critical | Score calculation |
| Resilience Intelligence | TC-RI-002 | ⏳ Pending | - | Medium | Color coding logic |
| Resilience Intelligence | TC-RI-003 | ⏳ Pending | - | Low | Trend graph tooltips |
| Fleet Command | TC-FC-001 | ⏳ Pending | - | Medium | Search functionality |
| Fleet Command | TC-FC-002 | ⏳ Pending | - | High | Bulk actions |
| Fleet Command | TC-FC-003 | ⏳ Pending | - | High | Status indicators |
| Alerts Page | TC-AL-001 | ⏳ Pending | - | Critical | Filter logic |
| Alerts Page | TC-AL-002 | ⏳ Pending | - | Critical | Workflow transitions |
| Alerts Page | TC-AL-003 | ⏳ Pending | - | Medium | Assignment system |
| Incidents Page | TC-IN-001 | ⏳ Pending | - | High | Status workflow |
| Incidents Page | TC-IN-002 | ⏳ Pending | - | Medium | MITRE mapping |
| Incidents Page | TC-IN-003 | ⏳ Pending | - | Low | Export function |
| Malware Scanner | TC-MS-001 | ⏳ Pending | - | Critical | EICAR detection |
| Malware Scanner | TC-MS-002 | ⏳ Pending | - | Critical | Clean file test |
| Malware Scanner | TC-MS-003 | ⏳ Pending | - | Medium | File size limit |
| Audit Logs | TC-AU-001 | ⏳ Pending | - | Critical | Immutability |
| Audit Logs | TC-AU-002 | ⏳ Pending | - | High | Traceability |
| Audit Logs | TC-AU-003 | ⏳ Pending | - | Medium | Search function |
| Team Management | TC-TM-001 | ⏳ Pending | - | Critical | RBAC enforcement |
| Team Management | TC-TM-002 | ⏳ Pending | - | Medium | Invite flow |
| Settings | TC-ST-001 | ⏳ Pending | - | High | Data persistence |
| Settings | TC-ST-002 | ⏳ Pending | - | Critical | API key security |
| Integration | TC-INT-001 | ⏳ Pending | - | High | Alert to Incident |
| Integration | TC-INT-002 | ⏳ Pending | - | Medium | Global search |
| Integration | TC-INT-003 | ⏳ Pending | - | High | Session security |

**Legend**: ✅ Pass | ❌ Fail | ⚠️ Warning | ⏳ Pending | 🔄 Retest

---

## 1. Command Center (Home Page) Tests

### TC-CC-001: Data Integrity Check
**Priority**: High  
**Type**: Functional  

**Pre-conditions**:
- User is logged in as Admin
- System has at least 1 endpoint registered

**Test Steps**:
1. Navigate to Command Center (Home)
2. Note the "Total Endpoints" number displayed in the stats card
3. Navigate to Fleet Command Center page
4. Count the total number of endpoints in the fleet grid
5. Compare both numbers

**Expected Result**:
- The "Total Endpoints" number on Command Center MUST exactly match the count in Fleet Command Center
- No discrepancy allowed (margin of error: 0)

**Test Data**: N/A  
**Criticality**: High - Data integrity issue

---

### TC-CC-002: Navigation Check - Quick Stats Cards
**Priority**: High  
**Type**: Functional + Navigation

**Test Steps**:
1. On Command Center, click "Active Alerts" card
2. Verify redirection to Alerts Page
3. Check if "Active" filter is pre-applied
4. Return to Command Center
5. Click "Open Incidents" card
6. Verify redirection to Incidents Page
7. Return and test remaining cards

**Expected Result**:
- Clicking "Active Alerts" → Redirects to `/alerts` with status filter = "Active"
- Clicking "Open Incidents" → Redirects to `/incidents` with open incidents visible
- Clicking "Total Endpoints" → Redirects to `/fleet`
- Clicking "Audit Logs" → Redirects to `/audit-logs`
- All redirections complete within 1 second

**Test Data**: System must have at least 1 alert and 1 incident

---

### TC-CC-003: Feed Latency Test
**Priority**: Medium  
**Type**: Performance + Real-time Updates

**Test Steps**:
1. Open Command Center in Browser A
2. Observe the "Recent Activity Feed"
3. Open a second browser/tab (Browser B) with same application
4. In Browser B, perform a distinct action (e.g., create a new alert, scan a file)
5. Switch back to Browser A WITHOUT refreshing
6. Start timer
7. Wait for the feed to update

**Expected Result**:
- Feed should update within 5 seconds
- New activity should appear at the top of the feed
- No full page refresh required
- Update should be via WebSocket or polling mechanism

**Performance Benchmark**: ≤ 5 seconds

---

### TC-CC-004: Severity Logic - Alert Summary
**Priority**: High  
**Type**: Data Validation + Logic

**Test Steps**:
1. On Command Center, locate "Alert Summary" section
2. Note individual counts: Critical, High, Medium, Low
3. Calculate: Sum = Critical + High + Medium + Low
4. Compare Sum with "Total Active Alerts" number

**Expected Result**:
- Sum MUST equal Total Active Alerts
- Pie chart percentages should match the actual distribution
- If Total = 0, chart should show "No active alerts"

**Formula**: `Total Active Alerts = ∑(Critical, High, Medium, Low)`

---

## 2. Resilience Intelligence Tests

### TC-RI-001: Resilience Score Calculation Verification
**Priority**: Critical  
**Type**: Algorithm Validation

**Test Steps**:
1. Navigate to Resilience Intelligence page
2. Select an endpoint with KNOWN vulnerabilities
3. Document visible vulnerabilities:
   - Count of Critical CVEs: ____
   - Count of High CVEs: ____
   - Count of Medium CVEs: ____
   - Count of Low CVEs: ____
4. Manually calculate expected score using formula:
   ```
   Base Score = 100
   Deduction = (Critical × 20) + (High × 10) + (Medium × 5) + (Low × 1)
   Resilience Score = max(0, Base Score - Deduction)
   ```
5. Compare calculated score with displayed score

**Expected Result**:
- Displayed score matches calculated score (±2 points tolerance for rounding)
- Score should be between 0-100
- Higher vulnerabilities = Lower score

**Test Data**: Endpoint with mixed severity vulnerabilities

---

### TC-RI-002: Color Coding Logic
**Priority**: Medium  
**Type**: UI/UX Validation

**Test Steps**:
1. Find or create endpoint with score = 50
2. Verify color indicator is 🔴 Red
3. Find or create endpoint with score = 85
4. Verify color indicator is 🟢 Green
5. Find endpoint with score = 70
6. Verify color indicator is 🟡 Yellow

**Expected Result**:
- Score 0-59: 🔴 Red background/indicator
- Score 60-79: 🟡 Yellow/Amber
- Score 80-100: 🟢 Green
- Color transitions should be consistent across all views

**Color Hex Codes** (for validation):
- Red: `#EF4444` or `hsl(0, 84%, 60%)`
- Yellow: `#F59E0B` or `hsl(38, 92%, 50%)`
- Green: `#10B981` or `hsl(142, 71%, 45%)`

---

### TC-RI-003: Trend Graph Interactivity
**Priority**: Low  
**Type**: UI/UX

**Test Steps**:
1. Locate the resilience trend graph
2. Hover mouse over various data points on the line
3. Verify tooltip appears
4. Check tooltip content

**Expected Result**:
- Tooltip displays on hover within 200ms
- Tooltip shows: Date (YYYY-MM-DD) and Exact Score (0-100)
- Tooltip follows cursor movement
- Graph line highlights on hover

---

## 3. Fleet Command Center Tests

### TC-FC-001: Inventory Search - Negative Test
**Priority**: Medium  
**Type**: Error Handling

**Test Steps**:
1. Navigate to Fleet Command Center
2. Locate search input field
3. Enter a non-existent IP: `999.999.999.999`
4. Press Enter or click Search
5. Observe results

**Expected Result**:
- Page does NOT crash
- Empty state message displays: "No results found" or "No endpoints match your search"
- No console errors in browser DevTools
- Search can be cleared to show all results again

**Edge Cases to Test**:
- Special characters: `<script>alert('xss')</script>`
- SQL injection attempt: `' OR 1=1--`
- Very long string: (500 characters)

---

### TC-FC-002: Bulk Actions - Restart Agent
**Priority**: High  
**Type**: Functional + Audit

**Pre-conditions**:
- At least 3 endpoints must be online
- User has Admin permissions

**Test Steps**:
1. Select 3 endpoints using checkboxes
2. Click "Actions" dropdown
3. Select "Restart Agent"
4. Confirm action in dialog (if prompted)
5. Wait for operation to complete
6. Check for success toast/notification
7. Navigate to Audit Logs page
8. Search for "restart" action in last 5 minutes

**Expected Result**:
- Success message: "3 agents restarted successfully"
- Audit Log shows 3 separate entries:
  - `Action: Restart Agent, Target: [hostname1]`
  - `Action: Restart Agent, Target: [hostname2]`
  - `Action: Restart Agent, Target: [hostname3]`
- All entries timestamped within 1 second of each other
- Entries show current user as actor

---

### TC-FC-003: Status Indicator - Real-time Update
**Priority**: High  
**Type**: Real-time Monitoring

**Test Steps**:
1. Identify an endpoint with 🟢 green "Online" status
2. Note the hostname
3. Physically disconnect that endpoint from network OR stop the agent service
4. Start timer
5. Wait and observe status indicator without refreshing
6. Record time when indicator changes to 🔴 red

**Expected Result**:
- Status changes from 🟢 green to ⚪ gray/red within polling interval (default: 60 seconds)
- "Last Seen" timestamp updates to show exact disconnect time
- No page refresh required
- Tooltip on hover shows "Offline - Last seen: [timestamp]"

**Performance Benchmark**: Status update within 60-120 seconds

---

## 4. Alerts Page Tests

### TC-AL-001: Filtering Logic - Severity Filter
**Priority**: Critical  
**Type**: Data Filtering

**Pre-conditions**:
- System has alerts of all severities (Critical, High, Medium, Low)

**Test Steps**:
1. Navigate to Alerts page
2. Click severity filter dropdown
3. Select "Critical" only
4. Observe filtered results
5. Scroll through entire list
6. Verify NO alerts with severity "High", "Medium", or "Low" are visible
7. Repeat test for each severity level

**Expected Result**:
- Only "Critical" alerts display when filter is set to "Critical"
- Alert count updates to match filtered results
- No alerts slip through filter
- Clearing filter shows all alerts again

**SQL Equivalent**: `SELECT * FROM alerts WHERE severity = 'Critical'`

---

### TC-AL-002: Workflow Transitions - Status Change
**Priority**: Critical  
**Type**: State Management

**Test Steps**:
1. Note current total active alerts count in sidebar
2. Find an alert with status "New"
3. Click to open alert details
4. Change status dropdown from "New" to "Resolved"
5. Click "Save" or "Update"
6. Return to alerts list
7. Apply filter "Status: Active"
8. Verify the resolved alert is NOT in the list
9. Check sidebar alert counter

**Expected Result**:
- Alert disappears from "Active" view immediately
- Sidebar "Active Alerts" counter decreases by 1
- Alert still visible in "All" or "Resolved" view
- Audit log records status change
- Timestamp of resolution is captured

**State Transition**: `New → Resolved` (valid)  
**Invalid Transition to Test**: Cannot go from `Resolved → New` (should show error)

---

### TC-AL-003: Assignment System
**Priority**: Medium  
**Type**: Collaboration Feature

**Test Steps**:
1. Navigate to Alerts page
2. Open an unassigned alert
3. Click "Assign" button
4. Select team member "alice@voltaxe.com" from dropdown
5. Click "Assign"
6. Observe UI update
7. Check audit logs
8. (Optional) Check if Alice receives email notification

**Expected Result**:
- "Assigned To" field updates to "Alice Johnson" immediately
- Alert card shows avatar/initials of Alice
- Audit log shows: `Action: Alert Assigned, Target: [Alert ID], Assignee: alice@voltaxe.com`
- If notifications enabled, Alice receives email within 5 minutes
- Alert moves to Alice's "My Alerts" view

---

## 5. Incidents Page Tests

### TC-IN-001: Status Workflow with Auto-Logging
**Priority**: High  
**Type**: Workflow + Audit Trail

**Test Steps**:
1. Create or find incident with status "Investigating"
2. Open incident details
3. Change status dropdown to "Contained"
4. Click "Update Status"
5. Immediately scroll to Timeline section within incident details
6. Verify latest entry

**Expected Result**:
- Timeline auto-logs entry: `Status changed to Contained by [admin@voltaxe.com]`
- Entry includes exact timestamp
- Entry appears at TOP of timeline (newest first)
- No manual entry required
- Timeline persists after page refresh

**Timeline Format**:
```
[Icon] Status changed to Contained
By: admin@voltaxe.com
At: 2025-11-25 14:32:15 UTC
```

---

### TC-IN-002: MITRE ATT&CK Mapping - Technique Details
**Priority**: Medium  
**Type**: Reference Integration

**Test Steps**:
1. Navigate to Incidents page
2. Find incident with MITRE tag (e.g., "T1059 - Command and Scripting Interpreter")
3. Click on the MITRE tag
4. Observe behavior

**Expected Result**:
- Modal/tooltip/panel opens
- Displays MITRE technique details:
  - Technique ID: T1059
  - Technique Name: Command and Scripting Interpreter
  - Tactic: Execution
  - Description: Brief explanation
  - Mitigation suggestions
- Provides link to official MITRE ATT&CK website
- Modal can be closed via X button or clicking outside

**External Link Test**:
- Link should open: `https://attack.mitre.org/techniques/T1059/`

---

### TC-IN-003: Export Function - PDF Generation
**Priority**: Low  
**Type**: Reporting

**Test Steps**:
1. Open a resolved incident with complete details
2. Click "Export PDF" or "Download Report" button
3. Wait for download
4. Open downloaded PDF file
5. Validate content

**Expected Result**:
- PDF downloads within 10 seconds
- Filename format: `Incident_[ID]_[Date].pdf`
- PDF contains:
  - Incident ID
  - Current Status (Resolved)
  - Complete Timeline with timestamps
  - Affected endpoints list
  - MITRE ATT&CK mapping
  - Resolution notes
- PDF is legible (not corrupted)
- Formatting is professional (headers, footers, page numbers)

**PDF Specs**: Minimum 2 pages, readable fonts, properly formatted tables

---

## 6. Malware Scanner Tests

### TC-MS-001: Positive Detection - EICAR Test File
**Priority**: Critical  
**Type**: Malware Detection

**Pre-conditions**:
- YARA rules are loaded and active
- EICAR rule exists in rule set

**Test Steps**:
1. Download EICAR test file from: `https://secure.eicar.org/eicar.com`
2. Navigate to Malware Scanner page
3. Upload the EICAR file
4. Wait for scan to complete
5. Review scan results

**Expected Result**:
- Scan result: 🚫 **Malicious**
- Threat level: **Critical** or **High**
- Matched rule: `EICAR_Test_File` or similar
- Hash values (MD5/SHA256) displayed
- Recommendation: "Quarantine immediately"
- No false negative (MUST detect)

**EICAR String**:
```
X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*
```

---

### TC-MS-002: Negative Test - Clean File
**Priority**: Critical  
**Type**: False Positive Check

**Test Steps**:
1. Create a simple text file: `Hello.txt` with content: "Hello, World!"
2. Navigate to Malware Scanner
3. Upload `Hello.txt`
4. Wait for scan
5. Review results

**Expected Result**:
- Scan result: ✅ **Clean**
- Threat level: **None**
- Matched rules: 0
- Message: "No threats detected"
- File metadata shown correctly
- No false positive

**Additional Clean Files to Test**:
- Empty file (0 bytes)
- .docx file with text
- .jpg image
- .mp3 audio file

---

### TC-MS-003: Boundary Test - File Size Limit
**Priority**: Medium  
**Type**: Input Validation

**Test Steps**:
1. Create or obtain a file > 1GB (e.g., 1.5GB)
2. Navigate to Malware Scanner
3. Attempt to upload the large file
4. Observe system response

**Expected Result**:
- Upload is rejected BEFORE scan starts
- Clear error message displays: **"File size exceeds limit. Maximum size is 1GB"**
- No server-side processing occurs
- Page does not crash
- User can upload a smaller file immediately after

**Test File Sizes**:
- 1.0 GB (1,073,741,824 bytes) → ✅ Should accept
- 1.1 GB (1,181,116,007 bytes) → ❌ Should reject

---

## 7. Audit Logs Tests

### TC-AU-001: Immutability Test - Read-Only Enforcement
**Priority**: Critical  
**Type**: Security + Data Integrity

**Test Steps**:
1. Navigate to Audit Logs page
2. Select any log entry
3. Right-click on entry
4. Look for edit/delete options
5. Attempt to modify log entry via:
   - UI buttons
   - Browser DevTools console
   - Direct API call (if access available)

**Expected Result**:
- NO "Edit" button exists
- NO "Delete" button exists
- Right-click context menu shows no modification options
- Attempting API call returns `403 Forbidden` or `405 Method Not Allowed`
- Logs are 100% immutable
- Only "View Details" and "Export" actions available

**Security Validation**: Audit logs MUST be tamper-proof per compliance requirements (SOC 2, ISO 27001)

---

### TC-AU-002: Traceability - Action Capture
**Priority**: High  
**Type**: Functional + Timing

**Test Steps**:
1. Note current timestamp: `[Start Time]`
2. Navigate to Settings page
3. Change "System Timezone" from "UTC" to "EST"
4. Click "Save Changes"
5. Immediately (within 5 seconds) navigate to Audit Logs
6. Check the top-most entry

**Expected Result**:
- Top entry shows:
  - Action: `Settings Change` or `System Configuration Updated`
  - User: `admin@voltaxe.com` (current user)
  - Target: `System Timezone`
  - Old Value: `UTC`
  - New Value: `EST`
  - Timestamp: Within 5 seconds of `[Start Time]`
- Log entry captured in real-time (< 5 sec latency)

**Traceability Matrix**:
| Action | Expected Log Entry |
|--------|-------------------|
| Login | `User logged in successfully` |
| Logout | `User logged out` |
| Create endpoint | `Endpoint added: [hostname]` |
| Delete alert | `Alert deleted: [alert_id]` |

---

### TC-AU-003: Search Function - User Filter
**Priority**: Medium  
**Type**: Search & Filter

**Test Steps**:
1. Navigate to Audit Logs
2. Locate search/filter input
3. Enter user email: `alice@voltaxe.com`
4. Press Enter or click Search
5. Review filtered results

**Expected Result**:
- Only logs where `User = alice@voltaxe.com` OR `Target = alice@voltaxe.com` are shown
- Logs include:
  - Actions performed BY Alice
  - Actions performed ON Alice (e.g., role change)
- Count updates to show filtered result count
- Other users' actions are hidden
- Clear search returns all logs

**Test Scenarios**:
- Search non-existent user → Shows "No logs found"
- Search with wildcard: `*@voltaxe.com` → Shows all company users (if supported)

---

## 8. Team Management Tests

### TC-TM-001: RBAC Enforcement - Viewer Role Restrictions
**Priority**: Critical  
**Type**: Security + Authorization

**Pre-conditions**:
- Create test user: `viewer@test.com` with role "Viewer"
- User account is activated

**Test Steps**:
1. Logout from Admin account
2. Login as `viewer@test.com` / `password123`
3. Navigate through each page and test:
   - Settings page: Check if "Delete System" button is visible
   - Fleet Command: Check if "Delete Endpoint" button is visible
   - Alerts: Try to delete an alert
   - Team Management: Try to modify other users
4. Document all restricted actions

**Expected Result**:
- "Delete" buttons are hidden OR disabled (grayed out)
- "Settings" page shows read-only view
- Fleet "Actions" dropdown shows only "View Details" (no destructive actions)
- Attempting to access restricted API endpoint returns `403 Forbidden`
- UI clearly indicates "Insufficient Permissions" if action attempted

**RBAC Matrix**:
| Feature | Admin | Analyst | Viewer |
|---------|-------|---------|--------|
| View Alerts | ✅ | ✅ | ✅ |
| Delete Alerts | ✅ | ❌ | ❌ |
| Modify Settings | ✅ | ❌ | ❌ |
| Execute Fleet Actions | ✅ | ✅ | ❌ |

---

### TC-TM-002: Invite Flow - Status Tracking
**Priority**: Medium  
**Type**: User Onboarding

**Test Steps**:
1. Navigate to Team Management page
2. Click "+ Add User" or "Invite" button
3. Enter email: `newuser@test.com`
4. Assign role: "Analyst"
5. Click "Send Invite"
6. Check user list table
7. Verify email was sent (check email inbox or logs)

**Expected Result**:
- User appears in table with status: **"Pending"** or **"Invitation Sent"**
- Invite email sent within 5 minutes
- Email contains:
  - Welcome message
  - Registration link (valid for 7 days)
  - Assigned role mentioned
- Status changes to **"Active"** after user accepts
- Invite can be resent if expired

**Email Validation**:
- Invalid email format: `test@` → Shows error "Invalid email format"
- Duplicate email → Shows error "User already exists"

---

## 9. Settings Tests

### TC-ST-001: Data Persistence - Session Timeout
**Priority**: High  
**Type**: Configuration Persistence

**Test Steps**:
1. Navigate to Settings page
2. Locate "Session Timeout" setting (current value: 30 minutes)
3. Change value to: **15 minutes**
4. Click "Save Changes"
5. Wait for success message
6. Refresh the page (F5 or Ctrl+R)
7. Check "Session Timeout" setting value

**Expected Result**:
- After refresh, value remains **15 minutes**
- Setting is persisted to database
- No reversion to default value
- All other settings remain unchanged
- Change is logged in Audit Logs

**Database Validation** (if accessible):
```sql
SELECT setting_key, setting_value FROM system_settings 
WHERE setting_key = 'session_timeout';
-- Expected: 15
```

---

### TC-ST-002: API Key Security - One-Time Display
**Priority**: Critical  
**Type**: Security

**Test Steps**:
1. Navigate to Settings → API Keys
2. Click "Generate New API Key"
3. Observe displayed key (e.g., `sk-abc123...xyz`)
4. Copy the key to clipboard
5. Close the modal/dialog
6. Refresh the page
7. Navigate back to API Keys section
8. Check how the key is displayed

**Expected Result**:
- On generation, full key is shown ONCE: `sk-abc123def456ghi789`
- User is warned: "Copy this key now. It won't be shown again."
- After page refresh, key is masked: `sk-****...***789` (first 3 and last 3 chars visible)
- Full key is NOT retrievable via UI
- Key is stored hashed in database (not plaintext)
- Old keys can be revoked but not viewed

**Security Checklist**:
- ✅ Key masked after first view
- ✅ No plaintext storage
- ✅ Key revocation available
- ✅ Audit log captures key generation

---

## 10. Cross-Module Integration Tests

### TC-INT-001: Alert to Incident Conversion
**Priority**: High  
**Type**: Workflow Integration

**Test Steps**:
1. Navigate to Alerts page
2. Select a Critical alert
3. Click "Convert to Incident" or "Create Incident"
4. Fill incident details (if prompted)
5. Submit
6. Navigate to newly created incident
7. Verify incident details page
8. Check if original alert is linked

**Expected Result**:
- Incident is created successfully
- Incident details page shows:
  - Reference to original Alert ID
  - Clickable link back to alert
  - Alert included in incident timeline
- Alert status changes to "Escalated to Incident"
- Both entries (alert + incident) linked bidirectionally

**Data Flow**: `Alert → Incident → Timeline Entry`

---

### TC-INT-002: Global Search - CVE Lookup
**Priority**: Medium  
**Type**: Search Integration

**Test Steps**:
1. Click Global Search bar in sidebar (or press `Ctrl+K`)
2. Type: `CVE-2023-1234`
3. Press Enter
4. Observe navigation

**Expected Result**:
- Search results dropdown shows matching CVE
- Clicking result navigates to CVE Database detail page
- Page displays:
  - CVE ID: CVE-2023-1234
  - CVSS Score
  - Description
  - Affected endpoints (if any)
  - Remediation steps
- Search history is maintained

**Additional Search Tests**:
- Search by hostname: `server-01` → Goes to endpoint detail
- Search by IP: `192.168.1.100` → Goes to endpoint detail
- Search by alert keyword: `ransomware` → Shows matching alerts

---

### TC-INT-003: Session Security - Concurrent Login Prevention
**Priority**: High  
**Type**: Security

**Pre-conditions**:
- "Concurrent Sessions" setting is DISABLED in Settings

**Test Steps**:
1. Login to application in Browser A (Chrome)
2. Note session remains active
3. Open Browser B (Firefox) in private mode
4. Login with SAME credentials in Browser B
5. Observe behavior in Browser A

**Expected Result**:
- Option 1: Browser A session is invalidated immediately
  - User is logged out automatically
  - Redirect to login with message: "Your session was terminated due to login from another location"
- Option 2: Browser B login is rejected
  - Error: "User already logged in from another device"
- Only ONE active session allowed per user
- Audit log shows: `Session terminated - New login from [IP]`

**Security Implications**: Prevents credential sharing and unauthorized access

---

## 11. Performance & Load Tests

### TC-PERF-001: Page Load Time
**Test All Pages**:
| Page | Expected Load Time | Actual Load Time | Pass/Fail |
|------|-------------------|------------------|-----------|
| Command Center | < 2 seconds | ⏳ | - |
| Resilience | < 3 seconds | ⏳ | - |
| Fleet Command | < 3 seconds | ⏳ | - |
| Alerts | < 2 seconds | ⏳ | - |
| Incidents | < 2 seconds | ⏳ | - |

**Tool**: Use Chrome DevTools → Network tab → "Finish" time

---

### TC-PERF-002: Concurrent User Load
**Test Steps**:
1. Simulate 10 concurrent users accessing Command Center
2. Monitor server CPU/RAM usage
3. Measure response times

**Expected Result**:
- All users receive response within 5 seconds
- No crashes or errors
- Server resource usage < 80%

**Tool**: Use Apache JMeter or k6 load testing

---

## 12. Security Tests

### TC-SEC-001: XSS Prevention
**Test Steps**:
1. In any text input field (e.g., search, comments)
2. Enter: `<script>alert('XSS')</script>`
3. Submit

**Expected Result**:
- Script does NOT execute
- Input is sanitized/escaped
- Displayed as plain text: `&lt;script&gt;...`

---

### TC-SEC-002: SQL Injection Prevention
**Test Steps**:
1. In search field, enter: `' OR '1'='1`
2. Execute search

**Expected Result**:
- No database error
- No unauthorized data returned
- Query is parameterized

---

### TC-SEC-003: CSRF Token Validation
**Test Steps**:
1. Inspect any form in DevTools
2. Look for hidden CSRF token field
3. Modify or remove token
4. Submit form

**Expected Result**:
- Request rejected with `403 Forbidden`
- Error: "Invalid CSRF token"

---

## 13. Accessibility Tests

### TC-ACC-001: Keyboard Navigation
**Test Steps**:
1. Navigate site using ONLY Tab key
2. Verify all interactive elements are reachable
3. Check focus indicators are visible

**Expected Result**:
- All buttons, links, inputs accessible via Tab
- Current focus has visible outline
- Escape key closes modals

---

### TC-ACC-002: Screen Reader Compatibility
**Test Steps**:
1. Enable screen reader (NVDA/JAWS)
2. Navigate Command Center
3. Verify announcements

**Expected Result**:
- Alt text on all images
- ARIA labels on interactive elements
- Meaningful page structure (headings)

---

## 14. Mobile Responsiveness Tests

### TC-MOB-001: Mobile Layout
**Test Steps**:
1. Open site in mobile viewport (375x667)
2. Test each page

**Expected Result**:
- Sidebar collapses to hamburger menu
- Tables scroll horizontally OR stack vertically
- Buttons are touch-friendly (44x44px minimum)
- Text is readable without zooming

---

## Test Execution Instructions

### Before Testing:
1. ✅ Ensure application is running on correct environment
2. ✅ Create test user accounts (Admin, Analyst, Viewer)
3. ✅ Populate database with sample data:
   - At least 10 endpoints
   - 20+ alerts (mixed severities)
   - 5+ incidents
   - Audit logs with various actions
4. ✅ Clear browser cache and cookies
5. ✅ Open browser DevTools console for error monitoring

### During Testing:
- 📸 Take screenshots of failures
- 📋 Record exact error messages
- ⏱️ Note timestamps for timing tests
- 🔍 Check browser console for JavaScript errors
- 📊 Use network tab to monitor API calls

### After Testing:
- 📝 Update status column for each test
- 🐛 Create bug tickets for failures
- 📈 Generate test summary report
- 🔄 Mark critical failures for immediate retest

---

## Bug Report Template

When a test fails, create a bug report with this format:

```markdown
**Bug ID**: BUG-[Number]
**Test Case**: TC-XX-XXX
**Severity**: Critical | High | Medium | Low
**Priority**: P1 | P2 | P3
**Status**: Open

**Environment**:
- Browser: Chrome 120.0
- OS: Windows 11
- User Role: Admin
- URL: http://localhost:3000/...

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots**:
[Attach screenshots]

**Console Errors**:
```
[Paste any console errors]
```

**Additional Notes**:
[Any other relevant information]
```

---

## Test Summary Report Template

After completing all tests, generate this summary:

```markdown
## QA Test Summary - Voltaxe Clarity Hub

**Test Date**: 2025-11-25
**Tester**: [Name]
**Build Version**: 1.0.0
**Total Test Cases**: 40

### Results Overview:
- ✅ **Passed**: XX (XX%)
- ❌ **Failed**: XX (XX%)
- ⚠️ **Warnings**: XX (XX%)
- ⏳ **Blocked/Not Run**: XX (XX%)

### Critical Failures:
1. [TC-XX-XXX] - [Brief description]
2. [TC-XX-XXX] - [Brief description]

### Recommendations:
- [Action item 1]
- [Action item 2]

### Sign-off:
- QA Lead: ________________  Date: ________
- Dev Lead: _______________  Date: ________
- Product Owner: __________  Date: ________
```

---

## Appendix A: Test Data Requirements

### Sample Endpoints
```json
[
  {"hostname": "web-server-01", "ip": "192.168.1.10", "os": "Ubuntu 22.04", "status": "online"},
  {"hostname": "db-server-01", "ip": "192.168.1.20", "os": "Windows Server 2022", "status": "online"},
  {"hostname": "app-server-01", "ip": "192.168.1.30", "os": "CentOS 8", "status": "offline"}
]
```

### Sample Alerts
```json
[
  {"id": 1, "severity": "critical", "type": "Malware Detected", "hostname": "web-server-01"},
  {"id": 2, "severity": "high", "type": "Brute Force Attempt", "hostname": "db-server-01"},
  {"id": 3, "severity": "medium", "type": "Unusual Network Traffic", "hostname": "app-server-01"}
]
```

### Sample CVEs
```
CVE-2023-1234, CVE-2024-5678, CVE-2024-9101
```

---

## Appendix B: Automation Scripts (Optional)

For advanced teams, create Playwright/Cypress test automation scripts based on these test cases.

**Example Playwright Test**:
```javascript
test('TC-CC-001: Data Integrity Check', async ({ page }) => {
  await page.goto('/');
  const commandCenterCount = await page.locator('[data-testid="total-endpoints"]').textContent();
  
  await page.goto('/fleet');
  const fleetCount = await page.locator('[data-testid="endpoint-card"]').count();
  
  expect(parseInt(commandCenterCount)).toBe(fleetCount);
});
```

---

**End of QA Test Plan**

**Document Version**: 1.0  
**Last Updated**: 2025-11-25  
**Next Review**: 2025-12-25

