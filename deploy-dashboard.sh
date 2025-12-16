#!/usr/bin/env bash
# Wrapper script to quickly run `deploy-to-server.sh` with optional socket support
set -e

BASEDIR=$(cd "$(dirname "$0")" && pwd)
DEPLOY_SCRIPT="$BASEDIR/deploy-to-server.sh"

if [ ! -f "$DEPLOY_SCRIPT" ]; then
  echo "Error: deploy-to-server.sh not found in repo root"
  exit 1
fi

# Parse flags
ENABLE_SOCKET=false
while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --enable-socket)
      ENABLE_SOCKET=true
      shift
      ;;
    --ssh-key)
      SSH_KEY="$2"
      shift 2
      ;;
    --ssh-user)
      SSH_USER="$2"
      shift 2
      ;;
    --server)
      SERVER="$2"
      shift 2
      ;;
    --help)
      echo "Usage: ./deploy-dashboard.sh [--enable-socket] [--ssh-key PATH] [--ssh-user NAME] [--server IP]"
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

# Export ENV variables for the deploy script
export ENABLE_SOCKET=${ENABLE_SOCKET}

# Call deploy-to-server.sh
if [ -n "$SSH_KEY" ]; then
  export SSH_KEY
fi
if [ -n "$SSH_USER" ]; then
  export SSH_USER
fi
if [ -n "$SERVER" ]; then
  export SERVER_IP=$SERVER
fi

bash "$DEPLOY_SCRIPT"
