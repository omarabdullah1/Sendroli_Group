#!/bin/bash
echo "Rebuilding frontend container..."
docker compose -f docker-compose.prod.yml up -d --build frontend
echo "Done!"
