#!/usr/bin/env bash
# Run the seed command on the remote server
# Usage:
#   ./seed-on-server.sh                      # uses SSH key at ~/.ssh/id_ed25519
#   ./seed-on-server.sh --ssh-pass "PASSWORD" # uses sshpass (must be installed)

set -e

SERVER_IP="72.62.38.191"
SSH_USER="root"
SSH_KEY="$HOME/.ssh/id_ed25519"
REMOTE_DIR="/opt/Sendroli_Group"

SSH_PASS=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --ssh-pass)
      SSH_PASS="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [ -f "$SSH_KEY" ]; then
  echo "Using SSH key $SSH_KEY to run seed on $SSH_USER@$SERVER_IP"
  ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" "cd $REMOTE_DIR && docker compose -f docker-compose.prod.yml exec -T backend npm run seed"
elif [ -n "$SSH_PASS" ]; then
  if command -v sshpass >/dev/null 2>&1; then
    echo "Using sshpass to run seed on $SSH_USER@$SERVER_IP"
    sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "cd $REMOTE_DIR && docker compose -f docker-compose.prod.yml exec -T backend npm run seed"
  else
    echo "sshpass is not installed. Install sshpass or provide an SSH key at $SSH_KEY"
    exit 1
  fi
else
  echo "No SSH key found at $SSH_KEY and no password provided. Aborting."
  exit 1
fi

echo "Seed step completed (check server logs)."