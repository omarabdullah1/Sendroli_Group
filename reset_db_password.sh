#!/bin/bash

echo "=== EMERGENCY DATABASE FIX === "
echo "1. Stopping existing services..."
docker-compose -f docker-compose.prod.yml stop backend mongodb

echo "2. Starting Maintenance Mode Database (No Auth)..."
# Start mongodb container with overrides: 
# -d: detached
# --name: static name for easy exec
# --entrypoint: override to run without --auth
# mongodb: service name
docker-compose -f docker-compose.prod.yml run -d --name mongo_maintenance --service-ports --entrypoint "mongod --bind_ip_all" mongodb

echo "Waiting 15 seconds for startup..."
sleep 15

echo "3. Forcing Password Update..."
# Run the update command. 
# We try updateUser first, if fails (user doesn't exist), we createUser.
docker exec mongo_maintenance mongosh admin --eval '
try {
  db.changeUserPassword("admin", "nhPUGO8s0YIhqJPIyGhbklApO");
  print("✅ Success: Admin password updated.");
} catch(e) {
  print("⚠️ Update failed (" + e.message + "). Trying create user...");
  try {
    db.createUser({
      user: "admin", 
      pwd: "nhPUGO8s0YIhqJPIyGhbklApO", 
      roles: [{ role: "root", db: "admin" }]
    });
    print("✅ Success: Admin user created.");
  } catch(e2) {
    print("❌ Error: " + e2.message);
  }
}
'

echo "4. Cleaning up maintenance container..."
docker stop mongo_maintenance
docker rm mongo_maintenance

echo "5. Restarting Production Services..."
docker-compose -f docker-compose.prod.yml up -d mongodb
echo "Waiting for DB to initialize..."
sleep 5
docker-compose -f docker-compose.prod.yml up -d backend

echo "=== Backend Logs ==="
docker logs -f sendroli-backend
