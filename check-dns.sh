#!/bin/bash

# Simple DNS Checker
# Usage: ./check-dns.sh yourdomain.com

DOMAIN=$1
EXPECTED_IP="72.62.38.191"

if [ -z "$DOMAIN" ]; then
    echo "Usage: ./check-dns.sh <your-domain>"
    exit 1
fi

echo "Checking DNS for $DOMAIN..."
echo "--------------------------------"

# Get IP using dig or host or ping
CURRENT_IP=$(dig +short $DOMAIN | head -n 1)

if [ -z "$CURRENT_IP" ]; then
    # Try ping if dig fails
    CURRENT_IP=$(ping -c 1 $DOMAIN 2>/dev/null | head -n 1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+')
fi

echo "Expected IP: $EXPECTED_IP"
echo "Current IP:  ${CURRENT_IP:-Not found}"
echo "--------------------------------"

if [ "$CURRENT_IP" == "$EXPECTED_IP" ]; then
    echo "✅ SUCCESS: Domain is pointing correctly!"
    echo "You can now run ./setup-ssl-certificate.sh"
else
    echo "❌ ERROR: Domain is NOT pointing to this server yet."
    echo "Please update your DNS 'A Record' to $EXPECTED_IP and wait."
fi
