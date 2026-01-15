#!/bin/bash
echo "=== Running Database Seeds ==="
echo "WARNING: This will wipe existing users and orders!"
docker exec sendroli-backend npm run seed
