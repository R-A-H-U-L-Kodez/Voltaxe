# 🚀 Voltaxe Clarity Hub - Production Deployment Guide

**Enterprise-grade cybersecurity monitoring and threat intelligence platform**

![Voltaxe Logo](https://via.placeholder.com/200x60/F4C430/000000?text=VOLTAXE)

## 🎯 Overview

Voltaxe Clarity Hub is a comprehensive cybersecurity platform that provides:

- **Real-time Threat Monitoring** - Live event tracking and alerting
- **Vulnerability Intelligence** - Integration with NIST NVD for CVE analysis
- **Endpoint Management** - Detailed hardware/software inventory and security actions
- **Professional Reporting** - PDF report generation with comprehensive security data
- **Advanced Analytics** - MITRE ATT&CK framework integration and threat mapping

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │────│  React Frontend │────│   FastAPI API   │
│   (Port 80/443) │    │   (Port 3000)   │    │   (Port 8000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                              ┌─────────────────┬─────────────┴─────┬──────────────────┐
                              │                 │                   │                  │
                    ┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐ ┌─────────────┐
                    │   PostgreSQL    │ │ Redis Cache │ │  CVE Sync Svc   │ │  Supabase   │
                    │   (Port 5432)   │ │(Port 6379)  │ │  (Background)   │ │    Auth     │
                    └─────────────────┘ └─────────────┘ └─────────────────┘ └─────────────┘
```

## 🚀 Quick Deployment

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 20GB+ disk space

### One-Command Deployment

```bash
git clone https://github.com/R-A-H-U-L-Kodez/Voltaxe.git
cd Voltaxe
./deploy.sh
```

The deployment script will:
1. ✅ Check system requirements
2. 🔧 Setup environment configuration
3. 🏗️ Build all Docker services
4. 🚀 Start the platform
5. 🗄️ Initialize the database
6. 🔄 Start CVE synchronization
7. 🎉 Provide access information

## 🔧 Manual Setup

### 1. Environment Configuration

Copy and customize the environment file:

```bash
cp .env.example .env
```

**Required Configuration:**

```bash
# Database (auto-generated secure password)
POSTGRES_PASSWORD=your-secure-password

# Authentication (Get from Supabase dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# CVE Intelligence (Get from NIST)
NVD_API_KEY=your-nvd-api-key
```

### 2. Build and Start Services

```bash
# Build all services
docker-compose build

# Start the platform
docker-compose up -d

# Check service health
./scripts/health_check.sh
```

### 3. Access the Platform

- **Web Interface**: http://localhost:80
- **API Documentation**: http://localhost:8000/docs
- **Default Login**: admin@voltaxe.com / password

## 🔐 Security Configuration

### 1. Supabase Authentication Setup

1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key from Settings > API
3. Update `.env` with your Supabase credentials
4. Configure authentication policies in Supabase dashboard

### 2. NIST NVD API Key

1. Request an API key at https://nvd.nist.gov/developers/request-an-api-key
2. Add your API key to `.env` as `NVD_API_KEY`
3. Restart the CVE sync service: `docker-compose restart cve_sync`

### 3. SSL/HTTPS Setup

For production deployment with SSL:

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Place certificates in `nginx/ssl/`
3. Uncomment HTTPS configuration in `nginx/nginx.conf`
4. Update port mapping in `docker-compose.yml`

```bash
# Get Let's Encrypt certificates
docker run -it --rm --name certbot \
  -v "$(pwd)/nginx/ssl:/etc/letsencrypt/live" \
  certbot/certbot certonly --standalone \
  -d your-domain.com -d www.your-domain.com
```

## 🛠️ Management Commands

### Service Management

```bash
# Start all services
docker-compose up -d

# Stop all services  
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Restart a specific service
docker-compose restart [service_name]

# Scale services
docker-compose up -d --scale api=3
```

### Database Operations

```bash
# Create backup
./scripts/backup_database.sh

# Restore from backup
gunzip -c /var/backups/voltaxe/backup.sql.gz | \
  docker-compose exec -T postgres psql -U voltaxe_admin -d voltaxe_clarity_hub

# Access database directly
docker-compose exec postgres psql -U voltaxe_admin -d voltaxe_clarity_hub
```

### Health Monitoring

```bash
# Full health check
./scripts/health_check.sh

# Monitor resource usage
docker stats

# View service status
docker-compose ps
```

### Updates

```bash
# Safe rolling update
./scripts/update.sh

# Manual update process
docker-compose pull
docker-compose up -d --no-deps [service_name]
```

## 📊 Monitoring and Alerts

### Built-in Monitoring

- **Service Health**: Automatic health checks for all services
- **Database Performance**: Query optimization and indexing
- **Resource Usage**: Memory and disk space monitoring
- **CVE Sync Status**: Real-time vulnerability database updates

### External Monitoring Integration

The platform exposes metrics endpoints for integration with:

- **Prometheus**: Metrics collection at `/metrics`
- **Grafana**: Pre-built dashboards available
- **ELK Stack**: Structured logging with JSON format
- **Datadog/New Relic**: APM integration ready

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | Database password | Auto-generated |
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Required |
| `NVD_API_KEY` | NIST NVD API key | Optional (slower sync) |
| `SYNC_INTERVAL_HOURS` | CVE sync frequency | 24 |
| `LOG_LEVEL` | Logging verbosity | INFO |
| `CORS_ORIGINS` | Allowed CORS origins | localhost |

### Service Configuration

Each service can be customized through environment variables and configuration files:

- **API**: `services/clarity_hub_api/main.py`
- **Frontend**: `services/clarity_hub_ui/src/`
- **Database**: `database/init/`
- **Nginx**: `nginx/nginx.conf`

## 🚨 Troubleshooting

### Common Issues

**Service won't start:**
```bash
# Check logs
docker-compose logs [service_name]

# Rebuild service
docker-compose build --no-cache [service_name]
```

**Database connection issues:**
```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready -U voltaxe_admin -d voltaxe_clarity_hub

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

**CVE sync not working:**
```bash
# Check CVE service logs
docker-compose logs cve_sync

# Restart CVE sync
docker-compose restart cve_sync
```

### Performance Tuning

**Database optimization:**
- Increase `shared_buffers` for larger datasets
- Tune `work_mem` for complex queries
- Enable `pg_stat_statements` for query analysis

**API scaling:**
- Use multiple API workers: `--workers 4`
- Enable Redis caching for frequent queries
- Configure load balancing in nginx

## 🔐 Security Best Practices

1. **Change default passwords** in production
2. **Enable SSL/HTTPS** for all communications
3. **Configure firewall rules** to restrict access
4. **Regular security updates** for all components
5. **Monitor audit logs** for suspicious activity
6. **Implement backup strategies** for data protection
7. **Use secret management** for sensitive configuration

## 📈 Scaling for Production

### Horizontal Scaling

```yaml
# Scale API service
docker-compose up -d --scale api=3

# Load balancing with nginx
upstream api_backend {
    server api_1:8000;
    server api_2:8000;
    server api_3:8000;
}
```

### Database Optimization

- **Read Replicas**: Configure PostgreSQL streaming replication
- **Connection Pooling**: Use pgbouncer for connection management
- **Partitioning**: Implement table partitioning for large datasets

### Caching Strategy

- **Redis**: Application-level caching for API responses
- **CDN**: Static asset delivery optimization
- **Browser Caching**: Proper cache headers configuration

## 🆘 Support

### Documentation

- **API Documentation**: Available at `/docs` endpoint
- **Technical Architecture**: See `docs/architecture.md`
- **Development Setup**: See `docs/development.md`

### Getting Help

- **GitHub Issues**: Report bugs and feature requests
- **Community Forum**: Join discussions and get support
- **Enterprise Support**: Contact for commercial deployments

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**🚀 Voltaxe Clarity Hub - Professional cybersecurity monitoring for the enterprise**

For the latest updates and documentation, visit: https://github.com/R-A-H-U-L-Kodez/Voltaxe
  
## Project Structure


```
Voltaxe/
├── README.md
└── services/
	├── clarity_hub_api/
	│   ├── main.py
	│   └── venv/
	│       ├── .gitignore
	│       ├── bin/
	│       ├── include/
	│       ├── lib/
	│       ├── lib64/
	│       └── pyvenv.cfg
	├── mock_ingestion_server/
	│   ├── main.py
	│   └── venv/
	│       ├── .gitignore
	│       ├── bin/
	│       ├── include/
	│       ├── lib/
	│       ├── lib64/
	│       └── pyvenv.cfg
	└── voltaxe_sentinel/
		├── go.mod
		├── go.sum
		└── main.go
```


### Services

- **clarity_hub_api**: Python FastAPI backend for database and API.
	- `main.py`: Main API and database logic.
	- `venv/`: Python virtual environment.
- **mock_ingestion_server**: Python-based mock ingestion server.
	- `main.py`: Entry point for the server.
	- `venv/`: Python virtual environment.
- **voltaxe_sentinel**: Go-based Sentinel service.
	- `main.go`: Main entry point for the Sentinel service.
	- `go.mod`, `go.sum`: Go module files.