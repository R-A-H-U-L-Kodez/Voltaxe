#!/bin/bash
# SSL Certificate Generation Script for Voltaxe
# Generates self-signed certificates for internal network usage
# Supports both development and production modes

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SSL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_FILE="$SSL_DIR/voltaxe.crt"
KEY_FILE="$SSL_DIR/voltaxe.key"
CSR_FILE="$SSL_DIR/voltaxe.csr"
DAYS_VALID=3650  # 10 years for internal use

# Default values
DOMAIN="${DOMAIN:-voltaxe.local}"
COUNTRY="${COUNTRY:-US}"
STATE="${STATE:-California}"
LOCALITY="${LOCALITY:-San Francisco}"
ORGANIZATION="${ORGANIZATION:-Voltaxe Security}"
ORG_UNIT="${ORG_UNIT:-IT Security}"
EMAIL="${EMAIL:-admin@voltaxe.local}"

# Parse command line arguments
MODE="dev"  # dev or prod
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --mode)
            MODE="$2"
            shift 2
            ;;
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --mode MODE       Certificate mode: dev (default) or prod"
            echo "  --domain DOMAIN   Domain name (default: voltaxe.local)"
            echo "  --force           Force regeneration of existing certificates"
            echo "  --help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Generate dev certificates"
            echo "  $0 --mode prod --domain voltaxe.com  # Generate production certificates"
            echo "  $0 --force                            # Force regenerate certificates"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

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

# Check if OpenSSL is installed
check_openssl() {
    if ! command -v openssl &> /dev/null; then
        log_error "OpenSSL is not installed"
        log_info "Install OpenSSL:"
        log_info "  Ubuntu/Debian: sudo apt-get install openssl"
        log_info "  CentOS/RHEL:   sudo yum install openssl"
        log_info "  macOS:         brew install openssl"
        exit 1
    fi
    log_success "OpenSSL found: $(openssl version)"
}

# Check if certificates already exist
check_existing_certs() {
    if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
        if [ "$FORCE" = false ]; then
            log_warning "Certificates already exist:"
            log_warning "  Certificate: $CERT_FILE"
            log_warning "  Private Key: $KEY_FILE"
            echo ""
            read -p "Do you want to regenerate them? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "Keeping existing certificates"
                exit 0
            fi
        else
            log_info "Force flag set - regenerating certificates"
        fi
    fi
}

# Backup existing certificates
backup_certs() {
    if [ -f "$CERT_FILE" ] || [ -f "$KEY_FILE" ]; then
        BACKUP_DIR="$SSL_DIR/backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        [ -f "$CERT_FILE" ] && cp "$CERT_FILE" "$BACKUP_DIR/"
        [ -f "$KEY_FILE" ] && cp "$KEY_FILE" "$BACKUP_DIR/"
        [ -f "$CSR_FILE" ] && cp "$CSR_FILE" "$BACKUP_DIR/"
        
        log_success "Backed up existing certificates to: $BACKUP_DIR"
    fi
}

# Generate certificates
generate_certs() {
    log_info "Generating SSL certificates for $MODE mode..."
    log_info "Domain: $DOMAIN"
    log_info "Valid for: $DAYS_VALID days (~$(($DAYS_VALID / 365)) years)"
    
    # Create Subject Alternative Names (SAN) configuration
    SAN_CONFIG="$SSL_DIR/san.cnf"
    cat > "$SAN_CONFIG" <<EOF
[req]
default_bits = 4096
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = req_ext

[dn]
C=$COUNTRY
ST=$STATE
L=$LOCALITY
O=$ORGANIZATION
OU=$ORG_UNIT
CN=$DOMAIN
emailAddress=$EMAIL

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = *.$DOMAIN
DNS.3 = localhost
DNS.4 = 127.0.0.1
DNS.5 = voltaxe.local
DNS.6 = *.voltaxe.local
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

    if [ "$MODE" = "prod" ]; then
        # Add production-specific SANs
        cat >> "$SAN_CONFIG" <<EOF
DNS.7 = www.$DOMAIN
DNS.8 = api.$DOMAIN
EOF
    fi
    
    # Generate private key
    log_info "Generating 4096-bit RSA private key..."
    openssl genrsa -out "$KEY_FILE" 4096 2>/dev/null
    chmod 600 "$KEY_FILE"
    log_success "Private key generated: $KEY_FILE"
    
    # Generate certificate signing request
    log_info "Generating certificate signing request..."
    openssl req -new -key "$KEY_FILE" -out "$CSR_FILE" -config "$SAN_CONFIG"
    log_success "CSR generated: $CSR_FILE"
    
    # Generate self-signed certificate
    log_info "Generating self-signed certificate..."
    openssl x509 -req \
        -in "$CSR_FILE" \
        -signkey "$KEY_FILE" \
        -out "$CERT_FILE" \
        -days $DAYS_VALID \
        -sha256 \
        -extensions req_ext \
        -extfile "$SAN_CONFIG" \
        2>/dev/null
    
    chmod 644 "$CERT_FILE"
    log_success "Certificate generated: $CERT_FILE"
    
    # Cleanup temporary files
    rm -f "$SAN_CONFIG"
    [ -f "$CSR_FILE" ] && rm -f "$CSR_FILE"
}

# Display certificate information
display_cert_info() {
    echo ""
    echo "=========================================="
    echo "Certificate Information"
    echo "=========================================="
    
    # Extract certificate details
    SUBJECT=$(openssl x509 -in "$CERT_FILE" -noout -subject | sed 's/subject=//')
    ISSUER=$(openssl x509 -in "$CERT_FILE" -noout -issuer | sed 's/issuer=//')
    NOT_BEFORE=$(openssl x509 -in "$CERT_FILE" -noout -startdate | sed 's/notBefore=//')
    NOT_AFTER=$(openssl x509 -in "$CERT_FILE" -noout -enddate | sed 's/notAfter=//')
    FINGERPRINT=$(openssl x509 -in "$CERT_FILE" -noout -fingerprint -sha256 | sed 's/SHA256 Fingerprint=//')
    
    echo "Subject:     $SUBJECT"
    echo "Issuer:      $ISSUER"
    echo "Valid From:  $NOT_BEFORE"
    echo "Valid Until: $NOT_AFTER"
    echo "Fingerprint: $FINGERPRINT"
    echo ""
    echo "Subject Alternative Names (SANs):"
    openssl x509 -in "$CERT_FILE" -noout -text | grep -A 10 "Subject Alternative Name" | tail -n +2 | sed 's/^[[:space:]]*/  /'
    echo ""
}

# Generate installation instructions
generate_instructions() {
    INSTRUCTIONS_FILE="$SSL_DIR/INSTALLATION_INSTRUCTIONS.txt"
    
    cat > "$INSTRUCTIONS_FILE" <<EOF
========================================
Voltaxe HTTPS Setup Instructions
========================================

Generated on: $(date)
Mode: $MODE
Domain: $DOMAIN

Files Generated:
- Certificate: $CERT_FILE
- Private Key: $KEY_FILE

========================================
1. Docker Deployment (Recommended)
========================================

The certificates are already in the correct location for Docker.
Simply restart your services:

  cd /home/rahul/Voltaxe
  docker-compose down
  docker-compose up -d nginx

Verify HTTPS is working:

  curl -k https://localhost/api/health
  # or
  curl -k https://$DOMAIN/api/health

========================================
2. Trust Self-Signed Certificate (Optional)
========================================

To avoid browser warnings, add the certificate to your trusted store:

Linux (Ubuntu/Debian):
  sudo cp $CERT_FILE /usr/local/share/ca-certificates/voltaxe.crt
  sudo update-ca-certificates

macOS:
  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERT_FILE

Windows:
  certutil -addstore -f "ROOT" $CERT_FILE

Firefox (all platforms):
  1. Open Settings → Privacy & Security → Certificates
  2. Click "View Certificates" → "Authorities" → "Import"
  3. Select $CERT_FILE
  4. Check "Trust this CA to identify websites"

========================================
3. Agent Configuration
========================================

Update your agent configuration to use HTTPS:

File: config/agent.conf
  API_SERVER=https://$DOMAIN

For self-signed certificates in development, the agent will automatically
skip TLS verification when connecting to localhost or .local domains.

Production agents should use proper CA-signed certificates.

========================================
4. Verify HTTPS Configuration
========================================

Check nginx is using SSL:
  docker logs voltaxe-nginx-1 | grep ssl

Test HTTPS endpoint:
  curl -k -v https://$DOMAIN/api/health

Check certificate expiry:
  openssl x509 -in $CERT_FILE -noout -enddate

========================================
5. Troubleshooting
========================================

Issue: "SSL certificate problem: self signed certificate"
Solution: Use -k flag with curl, or add certificate to trusted store

Issue: "nginx: [emerg] cannot load certificate"
Solution: Check file permissions (644 for cert, 600 for key)

Issue: "Connection refused on port 443"
Solution: Ensure docker-compose.yml exposes port 443

For more help, see: docs/HTTPS_SETUP.md

========================================
6. Production Deployment
========================================

For production, obtain a proper CA-signed certificate:

Using Let's Encrypt (Free):
  1. Install certbot: sudo apt-get install certbot python3-certbot-nginx
  2. Generate certificate: sudo certbot --nginx -d $DOMAIN
  3. Auto-renewal: sudo certbot renew --dry-run

Using Commercial CA:
  1. Generate CSR: openssl req -new -key $KEY_FILE -out voltaxe.csr
  2. Submit CSR to CA (DigiCert, GoDaddy, etc.)
  3. Replace $CERT_FILE with CA-provided certificate

========================================
EOF

    log_success "Installation instructions saved to: $INSTRUCTIONS_FILE"
}

# Main execution
main() {
    echo ""
    echo "=========================================="
    echo "Voltaxe SSL Certificate Generator"
    echo "=========================================="
    echo ""
    
    check_openssl
    check_existing_certs
    backup_certs
    
    # Create SSL directory if it doesn't exist
    mkdir -p "$SSL_DIR/backups"
    
    generate_certs
    display_cert_info
    generate_instructions
    
    echo "=========================================="
    echo -e "${GREEN}✅ SSL certificates generated successfully!${NC}"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "  1. Review installation instructions: cat $SSL_DIR/INSTALLATION_INSTRUCTIONS.txt"
    echo "  2. Restart nginx: docker-compose restart nginx"
    echo "  3. Test HTTPS: curl -k https://localhost/api/health"
    echo ""
    
    if [ "$MODE" = "dev" ]; then
        log_warning "⚠️  These are DEVELOPMENT certificates (self-signed)"
        log_warning "⚠️  For production, use Let's Encrypt or a commercial CA"
    fi
    
    echo ""
}

# Run main function
main
