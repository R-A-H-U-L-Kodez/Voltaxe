# Testing Report Generator - Step by Step Guide

## Current Status
✅ **Fixed API Response Handling**
- Events use `type` field (not `event_type`)
- Details can be string or JSON - now handles both
- Added comprehensive logging for debugging

## What You Should See Now

Based on your database, you currently have:
- **1 Vulnerability Event** (Docker Desktop CVE-2024-12345)
- **1 Rootkit Event** (Rootkit detected on kali)
- **Malware scans** (requires authentication to check)

## Testing Steps

### 1. Open Browser Console
Before generating a report:
```
Press F12 → Console Tab
```

### 2. Generate a Report
1. Navigate to **Reports** tab
2. Select **Report Type**: Security Summary Report
3. Select **Time Range**: Last 7 Days
4. Click **Generate Report**

### 3. Check Console Output
You should see:
```
📊 Fetching data for report generation...
📦 API Response Summary:
  - Snapshots: 1
  - Alerts: 1
  - Events: 2
  - Malware Scans: [number]
🔍 Filtered Events:
  - Vulnerabilities: 1
  - Rootkits: 1
📄 Report Data Summary:
  - Malware Detections: [number]
  - Vulnerabilities: 1
  - Rootkits: 1
```

### 4. Verify PDF Sections

The generated PDF should now include:

#### Page 1: Executive Summary
```
• Total Vulnerabilities: 1
• Security Alerts: 1
• Monitored Endpoints: 1
• Security Events: 2
• Malware Detected: [count]  ← NEW
• Rootkit Alerts: 1          ← NEW
```

#### Vulnerability Details Section (should appear)
```
🔓 Vulnerability Details
• kali - Unknown Unknown
  CVE: N/A
  Vulnerability found in Docker Desktop - CVE-2024-12345
```

#### Rootkit Alerts Section (should appear in RED)
```
🚨💀 CRITICAL: ROOTKIT ALERTS
• HOST: kali
  Detection: System scan
  ⚠️ Immediate forensic investigation required
```

#### Malware Section (if any scans exist)
```
🦠 Malware Detections
• [filename]
  Threat Level: [level] | Signatures: [matches]
```

## Expected Issues & Solutions

### Issue 1: Empty Sections
**Symptom:** No vulnerability/rootkit sections in PDF
**Check Console:** Look for filtered event counts
**Solution:** Events might be filtered out - check the console logs

### Issue 2: "No description" for vulnerabilities
**Cause:** Details field is a simple string
**Expected:** Should now show the full string as reason/description

### Issue 3: Malware section missing
**Possible Causes:**
1. No malware scans in database yet
2. Authentication required for `/api/malware/scans`
3. Empty array returned

**Test:** Upload a file through the Malware Scanner first

## How to Add Test Data

### Add Malware Scan:
1. Go to **Malware Scanner** tab
2. Upload EICAR test file or any file
3. Wait for scan to complete
4. Generate report again

### Add More Vulnerabilities:
The Sentinel agent should be sending these. Current event in DB:
```json
{
  "type": "VULNERABILITY_DETECTED",
  "hostname": "kali",
  "details": "Vulnerability found in Docker Desktop - CVE-2024-12345",
  "severity": "critical"
}
```

### Add More Rootkit Alerts:
Sentinel v1.4.0+ sends these on startup. Current event in DB:
```json
{
  "type": "ROOTKIT_DETECTED",
  "hostname": "kali",
  "details": "Event: Rootkit Detected",
  "severity": "medium"
}
```

## Debugging Commands

### Check Events Directly:
```bash
curl -s http://localhost:8000/events?limit=20 | python3 -m json.tool
```

### Check Malware Scans (requires auth):
```bash
# Get token from browser localStorage first
curl -s -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/malware/scans?limit=10 | python3 -m json.tool
```

### Check Database Directly:
```bash
sudo docker exec -it voltaxe-postgres-1 psql -U voltaxe -d voltaxe -c \
  "SELECT id, type, hostname, details FROM events ORDER BY timestamp DESC LIMIT 5;"
```

## Expected Report Structure

### With Current Data (1 vuln + 1 rootkit):

**Page 1:**
- Executive Summary (6 metrics including malware & rootkits)
- Endpoint Summary
- Recent Alerts

**Page 2 (or late Page 1):**
- 🔓 Vulnerability Details (1 entry)
- 🚨💀 CRITICAL: ROOTKIT ALERTS (1 entry in RED)
- Recommendations (updated with rootkit actions)

### With Malware Data Added:
- 🦠 Malware Detections section will appear
- Recommendations will include quarantine actions

## Success Criteria

✅ Console shows correct event counts
✅ PDF includes vulnerability section (1 entry)
✅ PDF includes rootkit section (1 entry in RED)
✅ Executive summary shows all 6 metrics
✅ Recommendations include rootkit-specific actions
✅ HTML report (if using advanced mode) shows all sections

## Troubleshooting

### Console shows "0 Vulnerabilities" and "0 Rootkits"
**Problem:** Event filtering isn't working
**Check:** 
```javascript
// In browser console
fetch('/api/events').then(r => r.json()).then(console.log)
```
Look at the response and verify field names

### PDF downloads but sections are missing
**Problem:** Sections only render if arrays have items
**Check:** Console logs for "Report Data Summary"
**Solution:** Ensure filtered arrays are not empty

### "Not authenticated" errors
**Problem:** Token missing or invalid
**Check:** localStorage.getItem('token') in console
**Solution:** Log in again to refresh token

## Next Steps

After verifying the report works:
1. ✅ Test with real malware scans
2. ✅ Verify all sections render correctly
3. ✅ Check multi-page PDF generation
4. ✅ Test HTML-to-PDF advanced mode
5. ✅ Verify dynamic recommendations based on threats

## Current Implementation Details

### Fixed Issues:
- ✅ Changed filter from `event_type` to `type`
- ✅ Added JSON string parsing for details field
- ✅ Added fallback field names for flexibility
- ✅ Added comprehensive console logging
- ✅ Improved error handling

### Data Flow:
```
API Response → Filter Events → Parse Details → Map to Report Format → Generate PDF
```

### Field Mappings:
```typescript
Vulnerability:
  software: details.vulnerable_software?.name || details.software || 'Unknown'
  version: details.vulnerable_software?.version || details.version || 'Unknown'
  cve: details.cve || 'N/A'
  reason: details.reason || details.description || details (string) || 'No details'

Rootkit:
  detectionMethod: details.detection_method || details.method || 'System scan'
  recommendation: details.recommendation || details.action || 'Immediate forensic investigation required'
```
