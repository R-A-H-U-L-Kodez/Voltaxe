# 🛡️ Voltaxe Clarity Hub - Enterprise Cybersecurity Platform

**Production-ready cybersecurity monitoring, threat intelligence, and endpoint protection**

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://github.com/R-A-H-U-L-Kodez/Voltaxe)
[![NIST NVD](https://img.shields.io/badge/NIST%20NVD-Integrated-blue)](https://nvd.nist.gov/)
[![Supabase](https://img.shields.io/badge/Supabase-Authentication-orange)](https://supabase.com/)
[![Go](https://img.shields.io/badge/Go-Sentinel%20Agent-00ADD8)](https://golang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-Frontend-61DAFB)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED)](https://www.docker.com/)

---

![Voltaxe Banner](https://via.placeholder.com/800x200/1a1a1a/F4C430?text=VOLTAXE+CLARITY+HUB+-+CYBERSECURITY+PLATFORM)

## 🎯 Overview

**Voltaxe Clarity Hub** is a comprehensive cybersecurity platform that provides enterprise-grade threat monitoring, vulnerability intelligence, rootkit detection, and endpoint security management. Built with modern technologies and production-ready architecture, it combines real-time behavioral analysis with NIST NVD CVE intelligence.

---

## 🌟 Core Capabilities

### 🛡️ Real-Time Endpoint Monitoring
Voltaxe continuously monitors endpoints across your infrastructure:
- **Process Activity**: Tracks all running processes with parent-child relationship analysis
- **Network Connections**: Real-time network traffic monitoring with ML-based anomaly detection
- **System Snapshots**: Comprehensive system state collection every scan cycle
- **Behavioral Analysis**: Identifies suspicious patterns and anomalous behavior

### 🔍 Advanced Threat Detection
Multi-layered security scanning:
- **Rootkit Detection**: Integrated scanning with real-time alert generation
- **Malware Scanning**: YARA-based detection with custom rule sets
- **Vulnerability Analysis**: Cross-references installed software against 312,000+ CVE records
- **ML Anomaly Detection**: Machine learning-based threat identification

### 📊 CVE Intelligence & Vulnerability Management
Integrated NIST NVD intelligence:
- **312,000+ CVE Records**: Complete vulnerability database with real-time synchronization
- **Fast API Integration**: 50 requests per 30 seconds with API key
- **CVSS Scoring**: Industry-standard severity ratings (v3.1 and v2.0)
- **Patch Tracking**: Identifies available patches and remediation paths
- **Exploit Intelligence**: Links to known exploits and mitigation strategies

### 🚨 Unified Threats Dashboard
Comprehensive threat monitoring interface:
- **General Alerts**: CVE vulnerabilities and security events
- **Rootkit Detection**: Dedicated rootkit scanning and alert management
- **Real-time Statistics**: Active threats, scan history, and detection metrics
- **Alert Management**: Mark threats as resolved, investigate details

### 🎮 Security Gamification
Transforms security monitoring into engaging experience:
- **North Star Score**: Single metric (0-100) representing security health
- **Risk Breakdown**: Visual security factor analysis
- **Path to Green**: Actionable remediation steps
- **Vulnerability Landscape**: Interactive threat distribution visualization

### � Strike Module - Remote Command Execution

Two-way communication system for incident response:           ▼

- **Command Polling**: Agents check for pending commands every 10 seconds    ┌─────────────────────────────────────────────────────────────┐

- **Direct Execution**: HTTP endpoint for immediate command dispatch    │          📊 Cross-Platform Agent Deployment                 │

- **Secure Communication**: Encrypted agent-to-server channels    │   Linux (AMD64/ARM64) • Windows • macOS • Docker          │

- **Panic Button**: Emergency endpoint isolation capability    └─────────────────────────────────────────────────────────────┘

```

---

## 🚀 Production Deployment (Ready!)

## 🏗️ System Architecture

### System Requirements

```

┌─────────────────────────────────────────────────────────────────┐- **OS**: Linux, macOS, or Windows with WSL2

│                  🌐 Clarity Hub Dashboard                       │- **Memory**: 4GB+ RAM (8GB+ recommended)  

│              React + TypeScript + Tailwind CSS                  │- **Storage**: 20GB+ available disk space

│   Gamification • Threat Visualization • Remediation Guidance   │- **Network**: Internet connectivity for CVE synchronization

└───────────────────────────┬─────────────────────────────────────┘- **Optional**: Docker for containerized deployment

Secure command queue system for remote operations:
- **Command Queue**: Agents poll for pending commands
- **Execution Reporting**: Results sent back with success/failure status
- **Priority Management**: Critical commands executed first
- **Audit Trail**: Complete logging of all remote operations

---

## 🏗️ System Architecture

```
                    🌐 Web Dashboard (React + TypeScript)
                       Vite • TailwindCSS • Port 3000
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  🔧 FastAPI Backend API                         │
│   Authentication • CVE Intel • Monitoring • Strike Commands    │
│              SQLAlchemy ORM • Supabase Auth • JWT              │
└──────┬──────────────────┬────────────────────┬──────────────────┘
       │                  │                    │
       ▼                  ▼                    ▼
┌─────────────┐  ┌──────────────────┐  ┌─────────────────┐
│ PostgreSQL  │  │  CVE Sync        │  │   Supabase      │
│  Database   │  │  Service         │  │   Auth          │
│             │  │                  │  │                 │
│ Endpoints   │  │ NIST NVD API     │  │ User Management │
│ Telemetry   │  │ 50 req/30s       │  │ JWT Tokens      │
│ CVEs        │  │ 312K+ Records    │  │ Production RLS  │
│ Rootkits    │  │ Auto-sync        │  │                 │
└─────────────┘  └──────────────────┘  └─────────────────┘
       ▲
       │ Telemetry & Alert Ingestion
       │
┌──────┴──────────────────────────────────────────────────────────┐
│            🛡️ Voltaxe Sentinel Agent (Go)                      │
│  Cross-Platform • Lightweight • Real-Time • Secure             │
│                                                                 │
│  • Process Monitoring    • Network Traffic Analysis            │
│  • Rootkit Detection     • Malware Scanning (YARA)            │
│  • Vulnerability Check   • Command Execution (Strike)          │
│  • ML Data Collection    • Behavioral Analysis                 │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│          📊 Monitored Endpoints (Linux/Windows/macOS)          │
│   Servers • Workstations • Cloud Instances • Edge Devices      │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start (Development)

Get up and running in under 5 minutes:

```bash
# Clone the repository
git clone https://github.com/R-A-H-U-L-Kodez/Voltaxe.git
cd Voltaxe

# Start all services with Docker
docker-compose up -d

# Open dashboard
open http://localhost:3000

# Default credentials
# Email: admin@voltaxe.com
# Password: admin123
```

---

## 🏭 Production Deployment

For production environments:

```bash
# Full production setup with automated configuration
./deploy.sh
```

**The deployment includes:**
- ✅ Automated service orchestration with Docker
- ✅ Database initialization with optimizations
- ✅ SSL certificate setup (optional)
- ✅ Production security configurations
- ✅ Automated backup strategies
- ✅ Health monitoring and logging
- ✅ Nginx reverse proxy configuration

---

## ⚙️ Configuration & Setup

### 🔐 Authentication (Supabase Integration)

**Production-ready authentication with user management:**

1. **Create Supabase Project**: Visit [supabase.com](https://supabase.com)
2. **Get API Keys**: Settings > API > Copy URL and anon key
3. **Configure Environment**:
   ```bash
   # In services/clarity_hub_api/.env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. **User Registration**: Self-service registration via dashboard or API

### 🔍 CVE Intelligence (NIST NVD Integration)

**Enhanced vulnerability synchronization (10x faster):**

1. **Get API Key**: Visit [NVD API Key Request](https://nvd.nist.gov/developers/request-an-api-key)
2. **Configure Service**:
   ```bash
   # In services/cve_sync_service/.env
   NVD_API_KEY=your-api-key-here
   ```
3. **Start Sync**: Service automatically syncs 312,000+ CVE records
4. **Monitoring**: Track sync progress via API logs

The platform cross-references collected data against:1. **Get API Key**: [nvd.nist.gov/developers/request-an-api-key](https://nvd.nist.gov/developers/request-an-api-key)

- **NIST CVE Database**: 312,000+ known vulnerabilities with CVSS scores2. **Configure Service**:

- **Rootkit Signatures**: Known rootkit patterns using `chkrootkit`   ```bash

- **YARA Rules**: Malware detection patterns   cd services/cve_sync_service

- **Behavioral Baselines**: ML-derived normal behavior patterns   ./setup_nvd_api.sh

   # Enter your API key when prompted

### 4️⃣ Analysis & Visualization   ```

The dashboard presents security data through:3. **Performance Boost**:

- **Fleet Overview**: All endpoints with risk levels, vulnerability counts, and status   - 🐌 **Without API Key**: 5 requests per 30 seconds

- **Resilience Intelligence**: Gamified security scoring and risk breakdown   - 🚀 **With API Key**: 50 requests per 30 seconds (10x faster!)

- **Malware Scanner**: Real-time scan results with YARA rule matches   - 📊 **Access**: 312,000+ CVE records

- **Path to Green**: Prioritized remediation steps with CVE details and "Fix It" actions

- **PDF Reports**: Comprehensive security assessments exportable for compliance### 🛡️ Agent Deployment



### 5️⃣ Response & Remediation**Deploy monitoring agents to endpoints:**

Security teams can:

### 🛡️ Sentinel Agent Deployment

**Deploy agents to all monitored endpoints:**

```bash
# Generate cross-platform deployment package
./deploy_agents.sh

# Deploy to Linux systems
cd deployment && sudo ./install_linux.sh

# Deploy to Windows systems (Run as Administrator)
cd deployment && .\install_windows.ps1
```

**Agent Features:**
- 🚀 Lightweight Go binary (~10MB)
- 🔄 Automatic reconnection and retry logic
- 🔐 Secure communication with TLS
- 📊 Configurable scan intervals
- 💾 Local buffering for offline resilience

---

## 🔬 Detection Capabilities

### 🦠 Rootkit Detection
- **Engine**: Integrated scanning with automated alerts
- **Detection**: Known rootkit signatures and system compromises
- **Output**: "INFECTED" markers trigger critical alerts
- **Coverage**: 70+ rootkit families
- **Dashboard**: Dedicated rootkit monitoring interface

### 🔍 Malware Scanning
- **Engine**: YARA rule-based detection
- **Detection**: Pattern-based malware signature matching
- **Rules**: Custom and community rule sets
- **Scope**: Files, memory, processes
- **History**: Complete scan history with timestamps

### 🔓 Vulnerability Analysis
- **Database**: 312,000+ CVE records from NIST NVD
- **Detection**: Software inventory correlation with CVE database
- **Scoring**: CVSS v3.1 and v2.0 severity ratings
- **Intelligence**: Direct links to exploit information
- **Updates**: Real-time synchronization (50 req/30s)

### 🧠 Behavioral Analysis
- **Technology**: Process monitoring + ML baseline comparison
- **Detection**: Suspicious parent-child process relationships
- **ML Phase**: Data collection for training (snapshots every 5 min)
- **Future**: Anomaly scoring and deviation detection

### 📡 Network Monitoring
- **Tracking**: Real-time connection monitoring
- **Detection**: All active network connections tracked
- **Granularity**: PID, process name, addresses, protocols, states
- **ML Analysis**: Port-based threat scoring
- **Frequency**: Snapshots every 30 seconds

---

## 🌐 System Access

### 📊 Web Dashboard
- **URL**: [http://localhost:3000](http://localhost:3000)
- **Features**: 
  - Real-time monitoring and threat analysis
  - Unified threats dashboard (Alerts + Rootkit)
  - Endpoint fleet management
  - Security gamification with North Star Score
  - Strike module for remote commands
- **Default Login**: `admin@voltaxe.com` / `admin123`

### 📡 API Documentation
- **URL**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Features**:
  - Interactive Swagger UI
  - Complete API documentation
  - Test endpoints directly
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🛡️ Security Features

### Production Security
- ✅ **JWT Authentication** with Supabase integration
- ✅ **CORS Protection** with configurable origins
- ✅ **Rate Limiting** on authentication endpoints
- ✅ **Input Validation** with Pydantic models
- ✅ **SQL Injection Prevention** with SQLAlchemy ORM
- ✅ **XSS Protection** with security headers
- ✅ **HTTPS Support** with SSL certificate management

### Monitoring Security
- ✅ **Real-time Vulnerability Detection**
- ✅ **Rootkit Scanning** with automated alerts
- ✅ **Behavioral Anomaly Detection**
- ✅ **Network Traffic Analysis**
- ✅ **Complete Audit Logging**

---

## 🎮 Dashboard Features

### Resilience Intelligence (Security Gamification)

**North Star Score**: Your security health in one metric (0-100)
- **Calculation**: Vulnerability exposure, patch compliance, configuration, behavioral risk
- **Color Coding**: 
  - 🟢 Green (90-100) - Excellent
  - 🟡 Yellow (70-89) - Good
  - 🟠 Orange (50-69) - Needs Attention
  - 🔴 Red (<50) - Critical
- **Trends**: Shows improvement or degradation over time

**Risk Breakdown**: Visual analysis of security factors
- Vulnerability exposure percentage
- Patch compliance status
- Configuration hardening score
- Behavioral risk assessment

**Path to Green**: Actionable remediation steps
- Prioritized "Fix It" buttons
- Step-by-step guidance
- Direct links to patches and documentation

**Vulnerability Landscape**: Interactive threat visualization
- Geographic distribution (if applicable)
- Severity distribution pie charts
- Timeline of detection events
- Affected endpoint mapping



### ⚡ Strike Module (Command Execution)

**Remote Command Capabilities:**
- **Command Queue**: Push commands to agents via polling mechanism
- **Status Tracking**: Pending → Running → Completed with timestamps
- **Result Capture**: Full stdout/stderr capture from agents
- **Panic Button**: Emergency endpoint isolation
- **Use Cases**: 
  - Emergency patching
  - Configuration changes
  - Forensic data collection
  - Service restarts
  - Endpoint isolation

**How It Works:**
1. Admin creates command in dashboard
2. Command stored in database with "pending" status
3. Agent polls every 30 seconds
4. Agent executes command and reports result
5. Dashboard displays real-time status updates

---

## 🔧 Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5 (lightning-fast HMR)
- **Styling**: TailwindCSS 3 with custom gold theme
- **Charts**: Recharts for data visualization
- **Routing**: React Router DOM v6
- **HTTP**: Axios with JWT interceptors
- **Icons**: Lucide React
- **State**: React Context + Hooks

### Backend
- **Framework**: FastAPI 0.104+ (async Python)
- **ORM**: SQLAlchemy 2.x with async support
- **Validation**: Pydantic v2 models
- **Authentication**: Supabase JWT integration
- **Security**: CORS, rate limiting, input validation
- **API Docs**: Auto-generated Swagger/ReDoc
- **Python**: 3.11+ required

### Database
- **Engine**: PostgreSQL 15+
- **Schema**: 10+ tables (endpoints, scans, alerts, CVEs, rootkit_scans, etc.)
- **Features**: Row-level security, indexes, foreign keys
- **Migrations**: Alembic for version control
- **Performance**: Optimized indexes for sub-second queries

### Agent (Sentinel)
- **Language**: Go 1.21+
- **Size**: ~10MB compiled binary
- **Features**: 
  - Cross-platform (Linux, Windows, macOS)
  - TLS encrypted communication
  - Auto-reconnect with exponential backoff
  - Local buffering for offline resilience
  - 30-second command polling
- **Dependencies**: Minimal (standard library + HTTP client)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Services**: 4 containers (frontend, api, postgres, cve_sync)
- **Networking**: Custom bridge network for inter-service communication
- **Volumes**: Persistent storage for database
- **Deployment**: Nginx reverse proxy with HTTPS support

### External Integrations
- **CVE Database**: NIST NVD API (312,000+ vulnerabilities)
- **Authentication**: Supabase cloud platform
- **Sync Frequency**: CVE updates every 6 hours
- **Rate Limits**: 50 req/30s with API key

---

## 📡 API Endpoints

### Authentication
```bash
# Login
POST /auth/login
Content-Type: application/json

{
  "email": "admin@voltaxe.com",
  "password": "admin123"
}

# Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "admin@voltaxe.com"
  }
}
```

### Rootkit Detection
```bash
# Get Rootkit Statistics
GET /rootkit/stats
Authorization: Bearer <token>

# Response
{
  "total_scans": 142,
  "active_alerts": 3,
  "resolved_alerts": 17,
  "last_scan": "2024-01-15T14:30:00Z",
  "threat_types": {
    "kernel_modules": 2,
    "system_binaries": 1
  },
  "severity_distribution": {
    "critical": 3,
    "high": 0,
    "medium": 0,
    "low": 0
  }
}

# Get Recent Scans
GET /rootkit/scans?limit=10
Authorization: Bearer <token>

# Trigger New Scan
POST /rootkit/scan
Authorization: Bearer <token>
{
  "endpoint_id": "endpoint-uuid"
}

# Get Alerts
GET /rootkit/alerts?status=active
Authorization: Bearer <token>

# Resolve Alert
PATCH /rootkit/alerts/{alert_id}
Authorization: Bearer <token>
{
  "status": "resolved",
  "notes": "False positive - legitimate kernel module"
}
```

### Endpoint Management
```bash
# List All Endpoints
GET /endpoints
Authorization: Bearer <token>

# Response
[
  {
    "id": "uuid",
    "hostname": "web-server-01",
    "ip_address": "192.168.1.100",
    "os": "Ubuntu 22.04",
    "status": "online",
    "last_heartbeat": "2024-01-15T14:35:00Z",
    "vulnerability_count": 12,
    "risk_score": 75
  }
]

# Get Endpoint Details
GET /endpoints/{endpoint_id}
Authorization: Bearer <token>

# Update Endpoint
PATCH /endpoints/{endpoint_id}
Authorization: Bearer <token>
{
  "status": "isolated",
  "notes": "Compromised - awaiting forensics"
}
```

### Command Execution (Strike Module)
```bash
# Create Command
POST /commands
Authorization: Bearer <token>
{
  "endpoint_id": "uuid",
  "command": "systemctl restart nginx",
  "description": "Restart web server"
}

# Poll Pending Commands (Agent)
GET /commands/poll/{endpoint_id}
Authorization: Bearer <agent-token>

# Update Command Status (Agent)
PATCH /commands/{command_id}
Authorization: Bearer <agent-token>
{
  "status": "completed",
  "output": "nginx.service restarted successfully",
  "exit_code": 0
}

# Panic Button (Emergency Isolation)
POST /endpoints/{endpoint_id}/isolate
Authorization: Bearer <token>
{
  "reason": "Detected rootkit activity"
}
```

### CVE Intelligence
```bash
# Search CVEs
GET /cves?keyword=apache&limit=20
Authorization: Bearer <token>

# Get CVE Details
GET /cves/{cve_id}
Authorization: Bearer <token>

# Response
{
  "cve_id": "CVE-2024-12345",
  "description": "Remote code execution in Apache...",
  "cvss_v3_score": 9.8,
  "severity": "CRITICAL",
  "published": "2024-01-10T00:00:00Z",
  "affected_endpoints": [
    {"id": "uuid", "hostname": "web-01"}
  ],
  "references": [
    "https://nvd.nist.gov/vuln/detail/CVE-2024-12345"
  ]
}
```

### Health Check
```bash
# System Health
GET /health

# Response
{
  "status": "healthy",
  "database": "connected",
  "cve_sync": "active",
  "timestamp": "2024-01-15T14:40:00Z"
}
```

---

## 🚀 Performance & Scale

### System Capabilities
- **CVE Sync**: 50 requests/30s (with API key) vs 5 req/30s (public)
- **Concurrent Users**: Scalable with multiple Uvicorn workers
- **Database**: Optimized indexes for sub-second queries on 312K+ CVEs
- **Agent Support**: 100+ endpoints per instance (tested)
- **Real-time**: 30-second agent polling for command execution
- **Storage**: ~2GB for full CVE database + logs

### Optimization Tips
- Enable PostgreSQL query logging for slow queries
- Increase Uvicorn workers for high traffic: `uvicorn main:app --workers 4`
- Use Redis for session caching (future enhancement)
- Configure agent polling interval based on network constraints
- Implement database partitioning for large-scale deployments

---

## 🛠️ Management & Operations

### Service Management
```bash
# Development Services
./scripts/start_services.sh          # Start backend + frontend
./scripts/stop_services.sh           # Stop all services
./status_dashboard.sh                # Check system status

# Production Services (Docker)
docker-compose up -d                 # Start all containers
docker-compose down                  # Stop all containers
docker-compose logs -f [service]     # View service logs
./scripts/health_check.sh            # Comprehensive health check
```

### Agent Management
```bash
# Build agents for all platforms
./build_agents.sh

# Deploy to Linux endpoint
cd deployment && sudo ./install_linux.sh

# Deploy to Windows endpoint (PowerShell as Admin)
cd deployment && .\install_windows.ps1

# Check agent status on endpoint
sudo systemctl status voltaxe-sentinel    # Linux
Get-Service VoltaxeSentinel               # Windows PowerShell
```

### Database Management

---

```bash

```bash
# Access PostgreSQL database
docker exec -it voltaxe_postgres psql -U voltaxe -d voltaxe_db

# Backup database
docker exec voltaxe_postgres pg_dump -U voltaxe voltaxe_db > backup.sql

# Restore database
docker exec -i voltaxe_postgres psql -U voltaxe voltaxe_db < backup.sql

# Monitor database size
docker exec voltaxe_postgres psql -U voltaxe -d voltaxe_db -c "SELECT pg_size_pretty(pg_database_size('voltaxe_db'));"
```

### CVE Synchronization
```bash
# Force immediate sync
cd services/cve_sync_service && python3 sync_cves.py

# Check sync status
curl http://localhost:8000/health

# View sync logs
docker-compose logs -f cve_sync

# Test API performance
python3 test_cve_performance.py
```

---

## 🚨 Troubleshooting Guide

### Quick Diagnostics
```bash
# Run comprehensive system check
./status_dashboard.sh

# Check service logs
docker-compose logs -f [frontend|api|postgres|cve_sync]

# Verify all services are running
docker-compose ps

# Test API connectivity
curl http://localhost:8000/health

# Check frontend build
cd services/clarity_hub_ui && npm run build
```

### Common Issues & Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Backend API not responding** | 502/503 errors, dashboard blank | `docker-compose restart api` or `./scripts/start_services.sh` |
| **CVE sync slow** | Long sync times, outdated data | Configure `NVD_API_KEY` in `.env` (50 req/30s vs 5 req/30s) |
| **No monitoring data** | Empty dashboard, no endpoints | Deploy Voltaxe Sentinel agent to endpoints |
| **Auth failures** | Login errors, 401/403 responses | Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env` |
| **Port conflicts** | Service start failures | Stop conflicting services: `sudo lsof -i :3000`, `sudo lsof -i :8000` |
| **Database connection errors** | `sqlalchemy.exc.OperationalError` | Check PostgreSQL container: `docker-compose logs postgres` |
| **Agent not connecting** | No heartbeats, offline status | Verify `agent.conf` API_URL and check firewall rules |
| **Frontend build errors** | White screen, console errors | Clear cache: `cd services/clarity_hub_ui && rm -rf node_modules dist && npm install` |

### Performance Optimization

**For High-Volume Environments:**
```bash
# Scale API workers (production)
uvicorn main:app --workers 4 --host 0.0.0.0 --port 8000

# Enable Redis caching (future enhancement)
docker-compose up -d redis

# Optimize database
docker exec voltaxe_postgres psql -U voltaxe -d voltaxe_db -c "VACUUM ANALYZE;"

# Monitor resource usage
docker stats
```

**Agent Optimization:**
- Increase polling interval for low-priority endpoints (default: 30s)
- Reduce snapshot frequency for stable systems (default: 5 min)
- Use bandwidth throttling for remote locations

---

## 🔧 Configuration Reference

### Core Environment Variables

| Variable | Purpose | Example | Required |
|----------|---------|---------|-----------|
| `SUPABASE_URL` | Authentication service | `https://xyz.supabase.co` | ✅ Production |
| `SUPABASE_ANON_KEY` | Public API key | `eyJhbGciOi...` | ✅ Production |
| `NVD_API_KEY` | CVE sync performance | `b4167123-3c6a...` | ⚠️ Recommended |
| `JWT_SECRET_KEY` | Token signing | `your-secret-key` | ✅ Production |
| `DATABASE_URL` | Database connection | `postgresql://user:pass@db:5432/voltaxe_db` | Auto-configured |

### Service Ports

| Service | Development Port | Production Port | Purpose |
|---------|------------------|-----------------|---------|
| Frontend | 3000 (Vite dev) | 80/443 (Nginx) | React dashboard |
| Backend API | 8000 | 8000 | FastAPI server |
| PostgreSQL | 5432 | 5432 | Database (Docker) |
| CVE Sync | - | - | Background service |

---

## 📚 Use Cases

### 🏢 Enterprise Security Operations Center (SOC)
- Monitor hundreds of endpoints from single dashboard
- Prioritize threats by CVSS severity and exploit availability
- Generate compliance reports with PDF export
- Respond to incidents with Strike Module commands
- Track security posture with North Star scoring

### 🚀 DevOps Security (DevSecOps)
- Continuous vulnerability scanning of cloud instances
- Automated patch compliance monitoring
- Behavioral analysis of containerized workloads
- Integration-ready API for CI/CD pipelines
- Real-time alerting for critical vulnerabilities

### 🛡️ Managed Security Service Providers (MSSP)
- Multi-tenant architecture (with RLS configuration)
- Per-customer fleet management and reporting
- White-label dashboard customization
- Audit logging for compliance (SOC 2, ISO 27001)
- Scalable infrastructure for 1000+ endpoints

### 🏥 Critical Infrastructure Protection
- Air-gapped deployment support (offline CVE database)
- Rootkit detection for compromised systems
- Emergency isolation capabilities (Panic Button)
- Forensic data collection via Strike Module
- Real-time threat intelligence correlation

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Write clean code** with TypeScript/Python type hints
3. **Add tests** for new features (Pytest, Jest)
4. **Update documentation** in README and docstrings
5. **Submit a pull request** with clear description

**Development Setup:**
```bash
# Clone your fork
git clone https://github.com/yourusername/voltaxe.git
cd voltaxe

# Install dependencies
cd services/clarity_hub_ui && npm install
cd ../clarity_hub_api && pip install -r requirements.txt
cd ../voltaxe_sentinel && go mod download

# Start development environment
./scripts/start_services.sh

# Run tests
npm test                    # Frontend tests
pytest                      # Backend tests
go test ./...               # Agent tests
```

**Code Standards:**
- Frontend: ESLint + Prettier
- Backend: Black + Pylint
- Agent: gofmt + golangci-lint

---

## 📝 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 Voltaxe Security Platform

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Support & Contact

**Documentation**: See `/docs` folder for detailed guides
- `QUICK_START.md` - Fast deployment guide
- `PRODUCTION_GUIDE.md` - Production deployment
- `API_DOCUMENTATION.md` - Complete API reference
- `TROUBLESHOOTING.md` - Common issues and solutions

**System Health**: Monitor status with `./status_dashboard.sh`

**Community**:
- Report issues on GitHub Issues
- Feature requests via GitHub Discussions
- Security vulnerabilities: See SECURITY.md

---

<div align="center">

**Built with ❤️ for Security Teams**

🔐 Protect · 🔍 Detect · 🛡️ Defend

[⬆ Back to Top](#voltaxe-security-platform)

</div>