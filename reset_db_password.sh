#!/bin/bash
# Reset MongoDB Password using the known credentials

echo "Resetting MongoDB 'admin' password..."

docker exec sendroli-mongodb mongosh admin --eval 'db.changeUserPassword("admin", "nhPUGO8s0YIhqJPIyGhbklApO")'

if [ $? -eq 0 ]; then
    echo "✅ Password reset successfully!"
else
    echo "❌ Failed to reset password. Trying to create user if not exists..."
    docker exec sendroli-mongodb mongosh admin --eval 'db.createUser({user: "admin", pwd: "nhPUGO8s0YIhqJPIyGhbklApO", roles: [{ role: "root", db: "admin" }]})'
fi

echo "Restarting Backend to apply changes..."
docker restart sendroli-backend
docker logs --tail 20 -f sendroli-backend
