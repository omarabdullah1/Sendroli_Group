#!/bin/bash
# fix_mongo_auth.sh - The "Nuclear" Option for resetting MongoDB password

echo "=== 1. Disabling MongoDB Authentication ==="
# Backup the file just in case
cp docker-compose.prod.yml docker-compose.prod.yml.bak

# Remove '--auth' from the command using sed
sed -i 's/command: mongod --auth/command: mongod/' docker-compose.prod.yml

echo "Applying change..."
docker-compose -f docker-compose.prod.yml up -d mongodb

echo "Waiting 10s for MongoDB to start without auth..."
sleep 10

echo "=== 2. Resetting Admin Password ==="
# Try to create user (ignore error if exists) and then update password
docker exec sendroli-mongodb mongosh admin --eval '
try {
  db.createUser({
    user: "admin", 
    pwd: "nhPUGO8s0YIhqJPIyGhbklApO", 
    roles: [{ role: "root", db: "admin" }]
  });
  print("✅ Admin user created.");
} catch(e) {
  print("ℹ️ User exists, updating password...");
  db.changeUserPassword("admin", "nhPUGO8s0YIhqJPIyGhbklApO");
  print("✅ Admin password updated.");
}
'

echo "=== 3. Re-enabling Authentication ==="
# Restore the original docker-compose file
mv docker-compose.prod.yml.bak docker-compose.prod.yml

echo "Restarting MongoDB with Auth..."
docker-compose -f docker-compose.prod.yml up -d mongodb

echo "Waiting 10s for restart..."
sleep 10

echo "=== 4. Restarting Backend ==="
docker-compose -f docker-compose.prod.yml restart backend

echo "=== 5. Checking Backend Connection ==="
sleep 5
docker logs --tail 20 sendroli-backend
