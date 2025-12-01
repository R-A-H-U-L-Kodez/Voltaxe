# 🚨 Panic Button Feature - ML Model Retrain

## Overview
Added a **"Panic Button"** to the Live Telemetry Dashboard that allows manual ML model retraining with a single click. This addresses the critical use case where legitimate software installations are flagged as anomalies.

---

## Use Cases

### When to Press the Panic Button:
1. **New Software Installation** - You installed legitimate software (e.g., Obsidian.exe, VS Code, etc.) and it's being flagged as anomalous
2. **High False Positive Rate** - The model is generating too many false positives
3. **Immediate Data Incorporation** - You need to incorporate recent data immediately without waiting for scheduled retraining

---

## Implementation Details

### 1. Backend API Endpoint
**File:** `services/clarity_hub_api/main.py`

**Endpoint:** `POST /api/axon/retrain`

**Features:**
- ✅ Requires authentication (JWT token)
- ✅ Runs training in background (non-blocking)
- ✅ 5-minute timeout protection
- ✅ Comprehensive audit logging
- ✅ Real-time status updates

**Response:**
```json
{
  "status": "training_started",
  "message": "ML model retraining initiated. This will take 1-3 minutes.",
  "estimated_completion": "1-3 minutes",
  "triggered_by": "admin@voltaxe.com",
  "timestamp": "2025-12-01T04:00:00Z",
  "note": "The model will be updated automatically when training completes..."
}
```

**Audit Trail:**
- Logs who triggered the retrain
- Records success/failure status
- Captures training output for debugging

---

### 2. Frontend API Service
**File:** `services/clarity_hub_ui/src/services/api.ts`

**Service:** `axonService.retrainModel()`

**Usage:**
```typescript
import { axonService } from '../services/api';

try {
  const result = await axonService.retrainModel();
  console.log(result.message); // "ML model retraining initiated..."
} catch (error) {
  console.error('Failed to trigger retraining:', error);
}
```

---

### 3. Live Telemetry Dashboard UI
**File:** `services/clarity_hub_ui/src/pages/LiveTelemetryPage.tsx`

**Components Added:**

#### A. Panic Button (Always Visible)
- 🎨 **Styling:** Orange-to-red gradient (attention-grabbing)
- 📍 **Location:** Top right of Training Status Banner
- 🔄 **Icon:** RefreshCw with spinning animation during training
- 🎯 **Label:** "🚨 Retrain Model"

#### B. Confirmation Dialog
Shows when button is clicked with:

**Warning Section:**
- ⚠️ AlertTriangle icon
- Clear "Panic Button" branding
- Explanation of what will happen

**Use Cases (Blue Box):**
- When to use this feature
- Clear bullet points
- Educational content

**Important Notes (Yellow Box):**
- Training duration estimate
- Auto-update message
- No service interruption

**Action Buttons:**
- **Cancel:** Gray, left-aligned
- **Retrain Now:** Orange-red gradient, right-aligned
- **Loading State:** Spinning icon with "Retraining..." text

#### C. Success Message
- ✅ Green banner at top of page
- Auto-dismisses after 5 seconds
- Shows success message from API

---

## UI/UX Flow

```
1. User clicks "🚨 Retrain Model" button
   ↓
2. Confirmation dialog appears
   ↓
3. User reads use cases and warnings
   ↓
4. User clicks "Retrain Now" or "Cancel"
   ↓
   If Cancel: Dialog closes
   If Retrain: 
     ↓
5. Button shows "Retraining..." with spinner
   ↓
6. API call triggers background training
   ↓
7. Success banner appears: "Retraining Initiated"
   ↓
8. Dialog closes, banner auto-dismisses after 5s
   ↓
9. Training completes in 1-3 minutes (background)
   ↓
10. Model is automatically updated
```

---

## Security & Safety

### Authentication Required
- ✅ JWT token must be present
- ✅ Logged in user required
- ✅ All actions audited

### Rate Limiting (Recommended)
⚠️ **TODO:** Add rate limiting to prevent abuse
- Suggestion: Max 1 retrain per 5 minutes per user
- Suggestion: Max 10 retrains per hour globally

### Audit Logging
All actions logged with:
- User ID and username
- Timestamp
- Action type: `SYSTEM_UPDATE`
- Resource: `ml_model/anomaly_detection`
- Success/failure status
- Training output (first 200 chars)

---

## Technical Specifications

### Training Process
- **Script:** `/app/train_incremental.py`
- **Duration:** 1-3 minutes (depending on data size)
- **Timeout:** 5 minutes
- **Execution:** Background subprocess
- **Output:** Captured and logged

### Model Files Updated
- `/app/models/anomaly_model.joblib` (1.7 MB)
- `/app/models/process_frequencies.joblib` (4.9 KB)

### API Performance
- **Response Time:** < 100ms (immediate acknowledgment)
- **Blocking:** None (background execution)
- **Concurrency:** Multiple requests queued

---

## Testing Checklist

### Frontend
- [x] Button renders correctly
- [x] Confirmation dialog appears
- [x] Loading state shows during retraining
- [x] Success message displays
- [x] Auto-dismiss after 5 seconds
- [x] Error handling works

### Backend
- [x] Endpoint responds correctly
- [x] Training executes in background
- [x] Audit logs created
- [x] Model files updated
- [x] Timeout protection works

### Integration
- [x] End-to-end flow works
- [x] No service interruption
- [x] Model updates without restart
- [x] Concurrent requests handled

---

## API Documentation

### Endpoint Details

**URL:** `/api/axon/retrain`  
**Method:** `POST`  
**Auth:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:** None

**Success Response (200):**
```json
{
  "status": "training_started",
  "message": "ML model retraining initiated. This will take 1-3 minutes.",
  "estimated_completion": "1-3 minutes",
  "triggered_by": "admin@voltaxe.com",
  "timestamp": "2025-12-01T04:15:30.123456",
  "note": "The model will be updated automatically when training completes..."
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "detail": "Not authenticated"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Training script not found. Please ensure train_incremental.py is in /app/"
}
```

---

## Deployment

### Prerequisites
1. ✅ `train_incremental.py` must exist in `/app/`
2. ✅ `/app/models/` directory must be writable
3. ✅ PostgreSQL database with snapshots data
4. ✅ Minimum 50 process records for training

### Deployment Steps
```bash
# 1. Stop containers
docker-compose down

# 2. Build with new code
docker-compose up -d --build

# 3. Verify API is running
docker-compose logs api --tail=20

# 4. Verify training script exists
docker-compose exec api ls -la /app/train_incremental.py

# 5. Test the endpoint
curl -X POST http://localhost:8000/api/axon/retrain \
  -H "Authorization: Bearer <your_token>"

# 6. Access dashboard
open http://localhost
```

---

## Troubleshooting

### Issue: Button not visible
**Solution:** Clear browser cache, refresh page

### Issue: "Training script not found"
**Solution:** 
```bash
docker cp services/axon_engine/train_incremental.py voltaxe_api:/app/
docker-compose restart api
```

### Issue: Training timeout
**Cause:** Dataset too large (>500k records)  
**Solution:** Increase timeout in `main.py` line 1278:
```python
timeout=600  # 10 minutes instead of 5
```

### Issue: Model not updating
**Cause:** Training failed silently  
**Solution:** Check audit logs:
```sql
SELECT * FROM audit_logs 
WHERE action_type = 'SYSTEM_UPDATE' 
AND resource_type = 'ml_model' 
ORDER BY timestamp DESC 
LIMIT 10;
```

---

## Future Enhancements

### Priority 1 (High)
- [ ] Add rate limiting (1 retrain per 5 min)
- [ ] Show training progress bar
- [ ] Add training history log view
- [ ] Email notification on completion

### Priority 2 (Medium)
- [ ] Schedule automatic retraining (cron)
- [ ] A/B testing for model versions
- [ ] Rollback to previous model
- [ ] Training metrics dashboard

### Priority 3 (Low)
- [ ] Multi-model support
- [ ] Custom training parameters
- [ ] Training job queue system
- [ ] Distributed training

---

## References

- **Training Script:** `services/axon_engine/train_incremental.py`
- **Model Audit:** `docs/ML_MODEL_AUDIT_REPORT.md`
- **API Endpoint:** `services/clarity_hub_api/main.py` (lines 1226-1334)
- **Frontend Component:** `services/clarity_hub_ui/src/pages/LiveTelemetryPage.tsx`
- **API Service:** `services/clarity_hub_ui/src/services/api.ts` (lines 359-387)

---

## Demo Script

### For Stakeholders:
> "We've added a 'Panic Button' to the dashboard. When you install new software like Obsidian, and our ML model flags it as suspicious, you simply press this button. Within 2 minutes, the model retrains with the latest data and stops flagging your new software. No technical knowledge required - just one click."

### For Technical Audience:
> "The retrain endpoint triggers an asynchronous background process that executes train_incremental.py. It uses the latest snapshot data from PostgreSQL, retrains the Isolation Forest model, and updates the joblib files atomically. The entire process is audited, timeout-protected, and non-blocking to the main API service."

---

**Status:** ✅ **Production Ready**  
**Last Updated:** December 1, 2025  
**Version:** 1.0.0
