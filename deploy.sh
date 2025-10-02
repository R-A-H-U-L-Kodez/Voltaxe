#!/bin/bash

# Voltaxe Clarity Hub - Production Deployment Script
# This script sets up and deploys the entire Voltaxe platform

set -e  # Exit on any error

echo "🚀 === VOLTAXE CLARITY HUB PRODUCTION DEPLOYMENT === 🚀"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "✅ System requirements satisfied"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.example .env
        
        # Generate secure passwords
        POSTGRES_PASSWORD=$(openssl rand -base64 32)
        SECRET_KEY=$(openssl rand -base64 32)
        JWT_SECRET=$(openssl rand -base64 32)
        
        # Update .env with secure values
        sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env
        sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
        sed -i "s/JWT_SECRET_KEY=.*/JWT_SECRET_KEY=$JWT_SECRET/" .env
        
        print_warning "⚠️  Please update .env file with your Supabase and NVD API credentials"
        print_warning "⚠️  Press any key to continue after updating .env file..."
        read -n 1 -s
    else
        print_status "✅ .env file found"
    fi
}

# Build services
build_services() {
    print_status "Building Voltaxe services..."
    
    # Build all services
    docker-compose build --no-cache
    
    print_status "✅ All services built successfully"
}

# Start services
start_services() {
    print_status "Starting Voltaxe Clarity Hub platform..."
    
    # Start all services
    docker-compose up -d
    
    print_status "Waiting for services to become ready..."
    sleep 30
    
    # Check service health
    check_service_health
}

# Check service health
check_service_health() {
    print_status "Checking service health..."
    
    # Check PostgreSQL
    if docker-compose exec postgres pg_isready -U voltaxe_admin -d voltaxe_clarity_hub > /dev/null 2>&1; then
        print_status "✅ PostgreSQL is ready"
    else
        print_error "❌ PostgreSQL is not ready"
        return 1
    fi
    
    # Check API
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_status "✅ API service is ready"
    else
        print_error "❌ API service is not ready"
        return 1
    fi
    
    # Check Frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "✅ Frontend service is ready"
    else
        print_error "❌ Frontend service is not ready"
        return 1
    fi
    
    print_status "🎉 All services are healthy and ready!"
}

# Initialize database
initialize_database() {
    print_status "Initializing database with optimizations..."
    
    # Run database initialization
    docker-compose exec postgres psql -U voltaxe_admin -d voltaxe_clarity_hub -f /docker-entrypoint-initdb.d/01_init_database.sql
    docker-compose exec postgres psql -U voltaxe_admin -d voltaxe_clarity_hub -f /docker-entrypoint-initdb.d/02_sample_data.sql
    
    print_status "✅ Database initialized successfully"
}

# Start CVE sync
start_cve_sync() {
    print_status "Starting CVE synchronization service..."
    
    if [ -n "${NVD_API_KEY}" ]; then
        print_status "🔑 NVD API key found - using authenticated rate limits"
        docker-compose up -d cve_sync
    else
        print_warning "⚠️  NVD API key not configured - CVE sync will use slower public rates"
        print_warning "   Get your free API key at: https://nvd.nist.gov/developers/request-an-api-key"
        docker-compose up -d cve_sync
    fi
    
    print_status "✅ CVE sync service started"
}

# Display final status
display_final_status() {
    echo ""
    echo "🎯 === VOLTAXE CLARITY HUB DEPLOYMENT COMPLETE === 🎯"
    echo ""
    echo -e "${GREEN}🌐 Web Interface:${NC}    http://localhost:80"
    echo -e "${GREEN}🔧 API Documentation:${NC} http://localhost:8000/docs"
    echo -e "${GREEN}📊 Database:${NC}          localhost:5432"
    echo -e "${GREEN}🔄 Redis Cache:${NC}       localhost:6379"
    echo ""
    echo -e "${BLUE}📋 Default Credentials:${NC}"
    echo "   Email: admin@voltaxe.com"
    echo "   Password: password"
    echo ""
    echo -e "${YELLOW}⚠️  Security Reminders:${NC}"
    echo "   1. Change default passwords in production"
    echo "   2. Configure Supabase for real authentication"
    echo "   3. Add NVD API key for CVE synchronization"
    echo "   4. Set up SSL certificates for HTTPS"
    echo "   5. Configure backup strategies for PostgreSQL"
    echo ""
    echo -e "${GREEN}🔧 Management Commands:${NC}"
    echo "   Stop services:    docker-compose down"
    echo "   View logs:        docker-compose logs -f [service]"
    echo "   Update services:  docker-compose pull && docker-compose up -d"
    echo "   Database backup:  ./scripts/backup_database.sh"
    echo ""
    echo "🚀 Voltaxe Clarity Hub is ready for cybersecurity operations!"
}

# Main deployment flow
main() {
    check_requirements
    setup_environment
    build_services
    start_services
    initialize_database
    start_cve_sync
    display_final_status
}

# Run deployment
main "$@"