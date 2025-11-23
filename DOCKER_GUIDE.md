hi rahul
```
http://localhost:3000
```
Beautiful dark theme UI with Resilience Intelligence, Snapshots, Live Events, Alerts, and Settings.

### **API Documentation (Swagger)**
```
http://localhost:8000/docs
```
Interactive API documentation and testing.

### **API Health Check**
```
http://localhost:8000/health
```

### **Production URL (via Nginx)**
```
http://localhost
```
rgwerklnfgowen f

## 🎮 Essential Docker Commands

### **Check if Running**
```bash
sudo docker-compose ps
```

### **Start All Services**
```bash
cd /home/rahul/Voltaxe/Voltaxe
sudo docker-compose up -d
```
The `-d` flag runs containers in the background (detached mode).

### **Stop All Services**
```bash
sudo docker-compose down
```

### **Restart All Services**
```bash
sudo docker-compose restart
```

### **Rebuild After Code Changes**
```bash
sudo docker-compose up -d --build
```
Use this after making changes to your code.

---

## 📋 Viewing Logs

### **All Services (Live)**
```bash
sudo docker-compose logs -f
```
Press `Ctrl+C` to exit.

### **Specific Service**
```bash
# Frontend logs
sudo docker-compose logs -f frontend

# API logs
sudo docker-compose logs -f api

# Database logs
sudo docker-compose logs -f postgres

# CVE Sync Service
sudo docker-compose logs -f cve_sync
```

### **Last 50 Lines**
```bash
sudo docker-compose logs --tail=50 api
```

---

## 🔍 Advanced Operations

### **Execute Commands Inside Containers**

**Access API Container:**
```bash
sudo docker exec -it voltaxe_api bash
```

**Access Database:**
```bash
sudo docker exec -it voltaxe_postgres psql -U postgres
```

**Access Frontend Container:**
```bash
sudo docker exec -it voltaxe_frontend sh
```

### **View Resource Usage**
```bash
sudo docker stats
```

### **Restart Specific Service**
```bash
sudo docker-compose restart api
sudo docker-compose restart frontend
```

---

## 🧹 Cleanup Commands

### **Stop and Remove Containers (Keep Data)**
```bash
sudo docker-compose down
```

### **Stop and Remove Everything (Including Data)**
```bash
sudo docker-compose down -v
```
⚠️ **Warning:** This deletes all database data!

### **Remove Unused Docker Resources**
```bash
sudo docker system prune -a
```

---

## 🔧 Troubleshooting

### **Service Won't Start**
```bash
# Check logs for errors
sudo docker-compose logs servicename

# Rebuild the service
sudo docker-compose up -d --build servicename
```

### **Port Already in Use**
```bash
# Find what's using the port
sudo lsof -i :3000
sudo lsof -i :8000

# Kill the process
sudo kill -9 <PID>
```

### **Database Connection Issues**
```bash
# Check if postgres is healthy
sudo docker-compose ps

# View postgres logs
sudo docker-compose logs postgres

# Restart postgres
sudo docker-compose restart postgres
```

### **Frontend Not Loading**
```bash
# Check if frontend is healthy
sudo docker-compose ps

# View frontend logs
sudo docker-compose logs frontend

# Rebuild frontend
sudo docker-compose up -d --build frontend
```

---

## 📊 Service Details

| Service | Port | Container Name | Purpose |
|---------|------|----------------|---------|
| Frontend | 3000 | voltaxe_frontend | React UI |
| API | 8000 | voltaxe_api | FastAPI Backend |
| Postgres | 5432 | voltaxe_postgres | Database |
| Redis | 6379 | voltaxe_redis | Cache |
| Nginx | 80/443 | voltaxe_nginx | Reverse Proxy |
| CVE Sync | - | voltaxe_cve_sync | Background Service |

---

## 🚀 Quick Start Workflow

### **Daily Use:**
```bash
# Start everything
cd /home/rahul/Voltaxe/Voltaxe
sudo docker-compose up -d

# Open browser to http://localhost:3000
# Work on your platform...

# When done, stop everything
sudo docker-compose down
```

### **After Making Code Changes:**
```bash
# Rebuild and restart
sudo docker-compose up -d --build

# Or rebuild specific service
sudo docker-compose up -d --build api
```

### **View Real-time Logs:**
```bash
# All services
sudo docker-compose logs -f

# Just API
sudo docker-compose logs -f api
```

---

## 💡 Tips

1. **Always run commands from:** `/home/rahul/Voltaxe/Voltaxe`
2. **Use `-d` flag** to run in background: `sudo docker-compose up -d`
3. **Use `-f` flag** to follow logs in real-time: `sudo docker-compose logs -f`
4. **Check health status** regularly: `sudo docker-compose ps`
5. **Rebuild after changes** to `.env`, Dockerfile, or requirements: `--build`

---

## 🎯 Most Common Commands

```bash
# Start
sudo docker-compose up -d

# Stop
sudo docker-compose down

# Restart
sudo docker-compose restart

# Logs
sudo docker-compose logs -f api

# Status
sudo docker-compose ps

# Rebuild
sudo docker-compose up -d --build
```

---

## 📞 Need Help?

- Check logs: `sudo docker-compose logs -f`
- Check status: `sudo docker-compose ps`
- Restart service: `sudo docker-compose restart <service-name>`
- Full rebuild: `sudo docker-compose up -d --build`

**Your platform is ready! Just open http://localhost:3000** 🎉
