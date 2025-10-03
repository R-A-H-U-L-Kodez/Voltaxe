# 🚀 Voltaxe Platform - One-Command Start Guide

## ⚡ **FASTEST WAY - One Click!**

```bash
./start-voltaxe.sh
```

That's it! This single command will:
- ✅ Start all 6 services (Database, API, Frontend, Redis, CVE Sync, Nginx)
- ✅ Wait for services to be healthy
- ✅ Show you the status
- ✅ Open the browser automatically
- ✅ Display access URLs

**Total time: ~10 seconds** ⏱️

---

## 🎮 **Using the Smart Launcher**

```bash
./run.sh start    # Start everything
./run.sh stop     # Stop everything
./run.sh logs     # View live logs
./run.sh status   # Check what's running
./run.sh build    # Rebuild after code changes
./run.sh restart  # Restart all services
```

---

## 🐳 **Using Docker Compose Directly**

If you prefer raw Docker commands:

### **Start Everything:**
```bash
sudo docker-compose up -d
```

### **Stop Everything:**
```bash
sudo docker-compose down
```

### **View Logs:**
```bash
sudo docker-compose logs -f
```

### **Check Status:**
```bash
sudo docker-compose ps
```

### **Rebuild After Code Changes:**
```bash
sudo docker-compose up -d --build
```

---

## 🌐 **Access Your Platform**

Once started, access at:

| Service | URL | Description |
|---------|-----|-------------|
| **Main UI** | http://localhost:3000 | Dark theme dashboard |
| **API Docs** | http://localhost:8000/docs | Swagger UI |
| **API Health** | http://localhost:8000/health | Health check |
| **Production** | http://localhost | Via Nginx proxy |

---

## 📊 **What Gets Started?**

When you run the platform, these services start automatically:

1. **PostgreSQL** (Port 5432) - Database
2. **Redis** (Port 6379) - Cache
3. **Backend API** (Port 8000) - FastAPI with 4 workers
4. **Frontend UI** (Port 3000) - React app with dark theme
5. **CVE Sync Service** - Background CVE updates
6. **Nginx** (Port 80/443) - Reverse proxy

All services have automatic health checks and dependency management!

---

## 🔧 **Common Workflows**

### **Daily Development:**
```bash
# Morning - Start everything
./start-voltaxe.sh

# Work on your features...
# Browser opens at http://localhost:3000

# Evening - Stop everything
./run.sh stop
```

### **After Making Code Changes:**
```bash
# Rebuild and restart
./run.sh build

# Or rebuild specific service
sudo docker-compose up -d --build api
sudo docker-compose up -d --build frontend
```

### **Troubleshooting:**
```bash
# Check what's running
./run.sh status

# View live logs
./run.sh logs

# Restart everything
./run.sh restart

# Nuclear option - clean restart
sudo docker-compose down
./start-voltaxe.sh
```

---

## 💡 **Pro Tips**

1. **Always run from project root:** `/home/rahul/Voltaxe/Voltaxe`

2. **Services start in order automatically:**
   - Database & Redis start first
   - API waits for database to be healthy
   - Frontend waits for API
   - Nginx starts last

3. **Background mode:** `-d` flag means detached (runs in background)

4. **Health checks:** Services have automatic health monitoring

5. **Data persistence:** Database and Redis data survive container restarts

---

## 🎯 **The ONLY Commands You Need**

```bash
# START EVERYTHING (one command!)
./start-voltaxe.sh

# STOP EVERYTHING
./run.sh stop

# VIEW LOGS
./run.sh logs

# CHECK STATUS
./run.sh status
```

**That's all you need to know!** 🎉

---

## 📞 **Quick Troubleshooting**

### **Services won't start:**
```bash
# Check logs
./run.sh logs

# Try clean restart
sudo docker-compose down
./start-voltaxe.sh
```

### **Port already in use:**
```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :8000

# Kill the process
sudo kill -9 <PID>
```

### **Database issues:**
```bash
# Restart just the database
sudo docker-compose restart postgres

# View database logs
sudo docker-compose logs postgres
```

---

## 🚀 **Getting Started (First Time)**

1. **Start the platform:**
   ```bash
   ./start-voltaxe.sh
   ```

2. **Wait ~10 seconds for services to start**

3. **Browser opens automatically at http://localhost:3000**

4. **Login with your credentials**

5. **Explore the Resilience Intelligence dashboard!**

---

## 🎉 **You're Ready!**

Just run:
```bash
./start-voltaxe.sh
```

And your entire Voltaxe cybersecurity platform starts in one command! 🚀

For more details, see `DOCKER_GUIDE.md`
