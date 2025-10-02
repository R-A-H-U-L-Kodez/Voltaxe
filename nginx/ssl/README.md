# This directory contains SSL certificates for HTTPS
# 
# For production deployment:
# 1. Obtain SSL certificates from Let's Encrypt or your certificate authority
# 2. Place the certificate files here:
#    - voltaxe.crt (certificate file)
#    - voltaxe.key (private key file)
# 3. Uncomment the HTTPS server block in nginx.conf
#
# For Let's Encrypt certificates:
# docker run -it --rm --name certbot \
#   -v "/path/to/nginx/ssl:/etc/letsencrypt/live" \
#   certbot/certbot certonly --standalone -d voltaxe.com -d www.voltaxe.com