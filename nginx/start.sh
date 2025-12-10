#!/bin/sh
# Wait helper script for nginx to ensure backend & frontend are reachable before starting nginx
set -e

BACKEND_HOST=${BACKEND_HOST:-sendroli-backend}
BACKEND_PORT=${BACKEND_PORT:-5000}
FRONTEND_HOST=${FRONTEND_HOST:-sendroli-frontend}
FRONTEND_PORT=${FRONTEND_PORT:-80}
TIMEOUT=${STARTUP_WAIT_TIMEOUT:-120}

echo "Waiting up to ${TIMEOUT}s for backend ${BACKEND_HOST}:${BACKEND_PORT} and frontend ${FRONTEND_HOST}:${FRONTEND_PORT}..."
start_time=$(date +%s)

wait_for() {
  host="$1"
  port="$2"
    while :; do
      if nc -z $host $port 2>/dev/null; then
      echo "Host $host:$port is reachable"
      return 0
    fi
    now=$(date +%s)
    elapsed=$((now - start_time))
    if [ "$elapsed" -ge "$TIMEOUT" ]; then
      echo "Timed out waiting for $host:$port after ${TIMEOUT}s"
      return 1
    fi
    sleep 1
  done
}

# Wait for backend
wait_for "$BACKEND_HOST" "$BACKEND_PORT" || exit 1
# Wait for frontend
wait_for "$FRONTEND_HOST" "$FRONTEND_PORT" || exit 1

echo "All upstreams available — launching nginx"
exec nginx -g 'daemon off;'
