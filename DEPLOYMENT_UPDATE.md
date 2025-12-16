# Deploying the New Dashboard (Minimal Guide)

This document outlines the recommended steps to deploy the updated dashboard, including optional Socket.io support.

Prerequisites
- Node.js 16+
- MongoDB access
- (Optional) Redis if you want caching
- `ENABLE_SOCKET` (server) and `VITE_ENABLE_SOCKET` (frontend) are optional environment variables to enable realtime communication.

Steps

1. Pull latest code on server:
```bash
cd /var/www/sendroli
git pull origin main
```

2. Build and deploy backend
```bash
cd backend
npm ci
# Set environment variables in .env file
# e.g., ENABLE_SOCKET=true
cp .env.example .env
# Edit .env to include ENABLE_SOCKET, FRONTEND_URL, MONGODB_URI, JWT_SECRET
npm run build || true # optional
npm start # or via pm2/nodemon/systemd
```

3. Build and deploy frontend
```bash
cd frontend
npm ci
# Copy .env.example to .env and edit VITE_API_URL and VITE_ENABLE_SOCKET
cp .env.example .env
# Add VITE_ENABLE_SOCKET=true if you enabled socket support above
npm run build
# Serve `dist` using nginx or static file server
```

4. NGINX configuration (example)
- Proxy `/api` to backend server
- Proxy websocket connections if using `Socket.io`

5. Verify
- Check `GET /api/health`
- Open frontend URL and access dashboard
- Ensure charts, KPI cards and recent orders appear

Notes
- If socket.io is enabled (ENABLE_SOCKET=true), ensure the backend exposes socket.io and the frontend uses socket client.
- For production-level caching, install and configure Redis and enable `cache.initCache`.

Wrapper usage (alternative)
```
# Run the wrapper and enable socket
./deploy-dashboard.sh --enable-socket --ssh-key ~/.ssh/id_ed25519 --ssh-user root --server 72.62.38.191
```
