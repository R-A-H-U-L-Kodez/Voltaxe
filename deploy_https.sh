#!/bin/bash
# HTTPS Deployment Automation Script
# Automatically generates certificates and enables HTTPS for Voltaxe

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
NGINX_SSL_DIR="$PROJECT_ROOT/nginx/ssl"
DOCKER_COMPOSE="$PROJECT_ROOT/docker-compose.yml"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check OpenSSL
    if ! command -v openssl &> /dev/null; then
        log_error "OpenSSL is not installed"
        exit 1
    fi
    
    log_success "All prerequisites met"
}

# Generate SSL certificates
generate_certificates() {
    log_info "Generating SSL certificates..."
    
    if [ ! -f "$NGINX_SSL_DIR/generate_certs.sh" ]; then
        log_error "Certificate generation script not found: $NGINX_SSL_DIR/generate_certs.sh"
        exit 1
    fi
    
    cd "$NGINX_SSL_DIR"
    
    # Check if certificates already exist
    if [ -f "voltaxe.crt" ] && [ -f "voltaxe.key" ]; then
        log_warning "Certificates already exist"
        read -p "Do you want to regenerate them? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Keeping existing certificates"
            return 0
        fi
    fi
    
    # Generate certificates
    ./generate_certs.sh --force
    
    log_success "Certificates generated"
}

# Verify nginx configuration
verify_nginx_config() {
    log_info "Verifying nginx configuration..."
    
    # Check if config file exists
    if [ ! -f "$PROJECT_ROOT/nginx/nginx.conf" ]; then
        log_error "nginx config not found: $PROJECT_ROOT/nginx/nginx.conf"
        exit 1
    fi
    
    # Check if HTTPS is configured
    if ! grep -q "listen 443 ssl" "$PROJECT_ROOT/nginx/nginx.conf"; then
        log_error "HTTPS not configured in nginx.conf"
        log_error "Please update nginx.conf to include HTTPS server block"
        exit 1
    fi
    
    log_success "nginx configuration verified"
}

# Stop services
stop_services() {
    log_info "Stopping existing services..."
    
    cd "$PROJECT_ROOT"
    docker-compose down 2>/dev/null || true
    
    log_success "Services stopped"
}

# Start services
start_services() {
    log_info "Starting services with HTTPS enabled..."
    
    cd "$PROJECT_ROOT"
    docker-compose up -d
    
    log_success "Services started"
}

# Wait for services to be ready
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    MAX_WAIT=60
    WAIT_COUNT=0
    
    while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
        if curl -k -s https://localhost/api/health > /dev/null 2>&1; then
            log_success "Services are ready"
            return 0
        fi
        
        sleep 2
        ((WAIT_COUNT+=2))
        echo -n "."
    done
    
    echo ""
    log_warning "Services may not be fully ready yet"
    log_info "Check logs with: docker-compose logs -f"
}

# Verify HTTPS is working
verify_https() {
    log_info "Verifying HTTPS configuration..."
    
    # Test 1: HTTPS endpoint
    if curl -k -s https://localhost/api/health | grep -q "healthy"; then
        log_success "✅ HTTPS endpoint working"
    else
        log_error "❌ HTTPS endpoint not responding"
        return 1
    fi
    
    # Test 2: HTTP redirect
    if curl -s -I http://localhost/api/health 2>/dev/null | grep -q "301\|302"; then
        log_success "✅ HTTP → HTTPS redirect working"
    else
        log_warning "⚠️  HTTP redirect may not be configured"
    fi
    
    # Test 3: HSTS header
    if curl -k -s -I https://localhost/api/health 2>/dev/null | grep -qi "Strict-Transport-Security"; then
        log_success "✅ HSTS security header present"
    else
        log_warning "⚠️  HSTS header not found"
    fi
    
    # Test 4: Certificate validity
    if openssl x509 -in "$NGINX_SSL_DIR/voltaxe.crt" -noout -checkend 2592000 > /dev/null 2>&1; then
        log_success "✅ Certificate valid for at least 30 days"
    else
        log_warning "⚠️  Certificate expires within 30 days"
    fi
    
    log_success "HTTPS verification complete"
}

# Display post-deployment information
display_info() {
    echo ""
    echo "=========================================="
    echo "  HTTPS Deployment Complete!"
    echo "=========================================="
    echo ""
    echo "✅ SSL certificates generated"
    echo "✅ nginx configured for HTTPS"
    echo "✅ Services running"
    echo ""
    echo "Access Points:"
    echo "  HTTPS: https://localhost"
    echo "  API:   https://localhost/api"
    echo "  HTTP:  http://localhost (redirects to HTTPS)"
    echo ""
    echo "Test Commands:"
    echo "  curl -k https://localhost/api/health"
    echo "  curl -I http://localhost/api/health"
    echo ""
    echo "View Logs:"
    echo "  docker logs -f voltaxe-nginx-1"
    echo "  docker logs -f voltaxe-api-1"
    echo ""
    echo "Certificate Information:"
    openssl x509 -in "$NGINX_SSL_DIR/voltaxe.crt" -noout -subject -dates | sed 's/^/  /'
    echo ""
    echo "Next Steps:"
    echo "  1. Update agent config: nano config/agent.conf"
    echo "     Change API_SERVER to https://localhost"
    echo ""
    echo "  2. Trust certificate (optional):"
    echo "     Linux:   sudo cp $NGINX_SSL_DIR/voltaxe.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates"
    echo "     macOS:   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $NGINX_SSL_DIR/voltaxe.crt"
    echo "     Windows: certutil -addstore -f \"ROOT\" $NGINX_SSL_DIR/voltaxe.crt"
    echo ""
    echo "  3. For production, use Let's Encrypt:"
    echo "     sudo certbot --nginx -d your-domain.com"
    echo ""
    echo "⚠️  NOTE: Using self-signed certificates"
    echo "⚠️  For production, obtain CA-signed certificates"
    echo ""
    echo "Documentation: docs/HTTPS_SETUP.md"
    echo "=========================================="
    echo ""
}

# Main execution
main() {
    echo ""
    echo "=========================================="
    echo "  Voltaxe HTTPS Deployment"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    generate_certificates
    verify_nginx_config
    stop_services
    start_services
    wait_for_services
    verify_https
    display_info
    
    log_success "Deployment complete!"
}

# Handle errors
trap 'log_error "Deployment failed at line $LINENO"; exit 1' ERR

# Run main
main
