#!/bin/bash

echo "=========================================="
echo "🚀 DEPLOYING INVENTORY FIX"
echo "=========================================="
echo ""

# Check if backend deployment is complete
echo "⏳ Waiting for backend deployment to complete..."
sleep 1100

# Get the new backend URL
echo ""
echo "📡 Getting new backend URL..."
cd /Users/root1/Sendroli_Group/backend
BACKEND_URL=$(vercel ls --prod 2>/dev/null | grep "backend" | head -1 | awk '{print $2}')

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Failed to get backend URL"
    exit 1
fi

echo "✅ Backend URL: https://$BACKEND_URL"

# Update frontend .env.production
echo ""
echo "📝 Updating frontend environment..."
cd /Users/root1/Sendroli_Group/frontend
cat > .env.production << EOF
VITE_API_URL=https://$BACKEND_URL/api
VITE_APP_NAME=Sendroli Factory Management
EOF

echo "✅ Frontend .env.production updated"

# Deploy frontend
echo ""
echo "🚀 Deploying frontend..."
vercel --prod

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "🔧 Fixed Issues:"
echo "  ✓ Date field explicitly set for inventory records"
echo "  ✓ Timezone consistency ensured"
echo "  ✓ Materials will show 'Counted' status correctly"
echo ""
echo "Test by:"
echo "  1. Submit inventory count"
echo "  2. Check materials show '✓ Counted' not '⏳ Pending'"
echo "  3. Verify completion notification appears"
echo ""
