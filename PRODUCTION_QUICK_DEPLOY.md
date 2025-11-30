# 🚀 Production Deployment Quick Start

## ⚡ Fast Track - Get Running in 5 Minutes

### Prerequisites
- Docker & Docker Compose installed
- Ports available: 8000 (API), 3000 (UI), 5432 (PostgreSQL)

### Step 1: Clone & Configure (1 min)

```bash
git clone https://github.com/R-A-H-U-L-Kodez/Voltaxe.git
cd Voltaxe

# Create environment file
cat > .env << EOF
POSTGRES_PASSWORD=YourSecurePassword123!
SECRET_KEY=$(openssl rand -hex 32)
NVD_API_KEY=your_nvd_api_key_here
EOF
```

### Step 2: Start Services (2 min)

```bash
docker-compose up -d
```

**Wait for services to start** (check with: `docker-compose ps`)

### Step 3: Verify System (1 min)

```bash
# Check API health
curl http://localhost:8000/health

# Check database
docker-compose exec postgres psql -U voltaxe_admin -d voltaxe_clarity_hub -c "SELECT 1;"

# View logs
docker-compose logs -f api
```

### Step 4: Access Dashboard (30 seconds)

Open browser: **http://localhost:3000**

---

## 🔧 Agent Deployment on Client Machines

### Quick Deploy (Windows)

1. **Copy agent** to client machine
2. **Create `agent.conf`** in same folder:
   ```
   API_SERVER=http://YOUR_SERVER_IP:8000
   SCAN_INTERVAL=60s
   ```
3. **Run agent**:
   ```powershell
   voltaxe_sentinel.exe
   ```

### Quick Deploy (Linux/Mac)

```bash
# On client machine
chmod +x voltaxe_sentinel
echo "API_SERVER=http://YOUR_SERVER_IP:8000" > agent.conf
./voltaxe_sentinel
```

---

## ⚠️ Critical Configuration Check

### ✅ Correct Configuration

```bash
# PostgreSQL is being used
docker-compose exec api env | grep DATABASE_URL
# Should output: postgresql://voltaxe_admin:...
```

### ❌ Incorrect Configuration

If you see any of these, **STOP AND FIX**:

```
❌ DATABASE_URL not set
❌ Using SQLite (sqlite:///)
❌ Agent using localhost:8000 on remote machine
```

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Services won't start | `docker-compose down && docker-compose up -d` |
| Database locked error | **This should NEVER happen now** - Check you're using PostgreSQL |
| Agent can't connect | Update `API_SERVER` in `agent.conf` to server IP (not localhost) |
| Port already in use | Change ports in `docker-compose.yml` |

---

## 📞 Health Check Commands

```bash
# All services running?
docker-compose ps

# Any errors in logs?
docker-compose logs --tail=50

# Database accessible?
docker-compose exec postgres pg_isready

# API responding?
curl -f http://localhost:8000/health || echo "API DOWN"
```

---

## 🎯 Success Indicators

**You're good if you see**:

```
✓ PostgreSQL container running
✓ API responding on port 8000
✓ UI accessible on port 3000
✓ No "database locked" in logs
✓ Agents connecting from remote machines
```

---

**For detailed information**, see:
- `docs/CRITICAL_FIXES_IMPLEMENTATION.md` - Complete implementation details
- `DEPLOYMENT_GUIDE.md` - Full deployment guide
- `TROUBLESHOOTING.md` - Detailed troubleshooting
