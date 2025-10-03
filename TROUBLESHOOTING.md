# Malware Scanner Error Troubleshooting Guide

## Improved Error Handling ✅

The malware scanner now has enhanced error handling that will show you **exactly** what went wrong:

### What Was Improved:

1. **Better Error Messages** - Instead of generic "ERROR: Test failed", you'll now see:
   - `ERROR: Not authenticated. Please login again.` - If token is missing
   - `ERROR: {specific API error}` - The actual error from the backend
   - `PASS: EICAR detected! (2 rules matched)` - Success with rule count

2. **Console Logging** - Check browser DevTools Console (F12) to see:
   - File upload details: `Uploading file: filename, Size: bytes`
   - Scan results: `Scan result: {data}`
   - Any errors: `Scan error: {error details}`

3. **Authentication Checks** - All components now verify token exists before making requests

## How to Check for Errors

### Method 1: Browser Console (Recommended)
1. Press **F12** to open DevTools
2. Click **Console** tab
3. Try the action that's failing
4. Look for red error messages or console.log outputs

### Method 2: Network Tab
1. Press **F12** to open DevTools
2. Click **Network** tab
3. Try the action that's failing
4. Look for red (failed) requests
5. Click on failed request to see:
   - Request Headers (check Authorization header)
   - Response (see exact error from server)

### Method 3: Check localStorage
```javascript
// In browser console (F12):
console.log('Token:', localStorage.getItem('token'));
console.log('Voltaxe Token:', localStorage.getItem('voltaxe_token'));
```

## Common Errors & Solutions

### Error: "Not authenticated"
**Cause**: No token in localStorage or expired token

**Solution**:
```bash
# 1. Clear browser storage
# In browser console (F12):
localStorage.clear()

# 2. Hard refresh
Ctrl + Shift + R (or Cmd + Shift + R on Mac)

# 3. Login again
Navigate to http://localhost:3000
Login with admin@voltaxe.com / password
```

### Error: "401 Unauthorized"
**Cause**: Invalid or expired JWT token

**Solution**:
```bash
# Get a fresh token
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@voltaxe.com","password":"password"}'

# Then login again in the UI
```

### Error: "Failed to scan file"
**Cause**: Could be file size, malware scanner not available, or token issue

**Check**:
```bash
# 1. Verify scanner is available
sudo docker exec voltaxe_api python3 -c "import yara; print('YARA OK')"

# 2. Check file size (must be < 100MB)
ls -lh /path/to/file

# 3. Test with EICAR first (small test file)
# Click "Test EICAR Detection" button
```

### Error: "Failed to load statistics"
**Cause**: Backend not responding or authentication issue

**Check**:
```bash
# 1. Check API health
curl http://localhost:8000/health

# 2. Test with token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@voltaxe.com","password":"password"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/malware/summary
```

### Error: Network error or CORS
**Cause**: API not accessible or CORS misconfiguration

**Check**:
```bash
# 1. Verify API is running
sudo docker-compose ps | grep api

# 2. Check API logs
sudo docker logs voltaxe_api --tail 50

# 3. Test direct API access
curl http://localhost:8000/health
```

## Step-by-Step Debugging

### Step 1: Verify Services Running
```bash
sudo docker-compose ps
# All services should show "Up" or "Up (healthy)"
```

### Step 2: Clear Everything & Start Fresh
```bash
# In browser (F12 Console):
localStorage.clear()

# Hard refresh:
Ctrl + Shift + R

# Navigate to:
http://localhost:3000

# Login with:
admin@voltaxe.com / password
```

### Step 3: Test EICAR Detection
1. Go to Malware Scanner page
2. Click "Test EICAR Detection" button
3. Should see: `PASS: EICAR detected! (2 rules matched)`

### Step 4: Check Browser Console
```javascript
// Should see logs like:
// - Token: eyJhbGciOiJIUz... (if authenticated)
// - No errors in red
```

### Step 5: Test File Upload
1. Create small test file:
```bash
echo "Hello World" > test.txt
```
2. Drag & drop into upload area
3. Check console for:
   - `Uploading file: test.txt, Size: 12`
   - `Scan result: {...}`

## API Endpoint Testing

Test all endpoints manually to isolate the issue:

### 1. Login & Get Token
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@voltaxe.com","password":"password"}' \
  | python3 -m json.tool
```

### 2. Test EICAR
```bash
TOKEN="your_token_here"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/malware/test-eicar \
  | python3 -m json.tool
```

### 3. Get Summary
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/malware/summary \
  | python3 -m json.tool
```

### 4. Upload File
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.txt" \
  http://localhost:8000/malware/scan \
  | python3 -m json.tool
```

## Container Logs

Check for errors in container logs:

```bash
# API logs (most important)
sudo docker logs voltaxe_api --tail 100 --follow

# Frontend logs
sudo docker logs voltaxe_frontend --tail 50

# All services
sudo docker-compose logs --tail 50 --follow
```

## What to Report

If error persists, provide:

1. **Browser Console Output** (F12 → Console tab)
2. **Network Tab Details** (F12 → Network → Failed request → Response)
3. **localStorage Content**:
   ```javascript
   console.log(localStorage)
   ```
4. **API Logs**:
   ```bash
   sudo docker logs voltaxe_api --tail 100
   ```
5. **Exact Error Message** from UI
6. **What Action Failed** (EICAR test, file upload, page load, etc.)

## Quick Fixes

### Nuclear Option (Reset Everything)
```bash
# Stop all services
sudo docker-compose down

# Start fresh
sudo docker-compose up -d

# Wait 30 seconds for services to be healthy
sleep 30

# Clear browser and login
# 1. Open http://localhost:3000
# 2. F12 → Console → localStorage.clear()
# 3. Hard refresh (Ctrl+Shift+R)
# 4. Login with admin@voltaxe.com / password
```

### Rebuild Containers
```bash
# Rebuild and restart
sudo docker-compose build frontend api
sudo docker-compose up -d frontend api

# Check status
sudo docker-compose ps
```

## Success Indicators ✅

When everything works, you should see:

1. **Login**: Successfully redirects to dashboard
2. **Token**: `localStorage.getItem('token')` returns JWT string
3. **EICAR Test**: `PASS: EICAR detected! (2 rules matched)`
4. **File Upload**: Shows scan results with threat level
5. **Statistics**: Numbers displayed (not loading forever)
6. **Scan History**: List of previous scans
7. **YARA Rules**: 11 rules displayed
8. **No Console Errors**: Console is clean (no red errors)

## Contact Information

If issue persists after all troubleshooting:
- Check API documentation: http://localhost:8000/docs
- Review implementation: `/home/rahul/Voltaxe/Voltaxe/MALWARE_SCANNER_FIXED.md`
- Check YARA detection docs: `/home/rahul/Voltaxe/Voltaxe/YARA_MALWARE_DETECTION.md`
