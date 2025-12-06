#!/bin/bash

# Test Invoice Notification System - Production Deployment

echo "🧪 Testing Invoice Notification System"
echo "========================================"
echo ""

BACKEND_URL="https://backend-4jprecu3t-oos-projects-e7124c64.vercel.app"

# Step 1: Check version
echo "📋 Step 1: Checking backend version..."
curl -s "${BACKEND_URL}/api/version" | python3 -m json.tool
echo ""
echo ""

# Step 2: Login as designer
echo "📋 Step 2: Login as designer..."
LOGIN_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"designer","password":"design123"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "$LOGIN_RESPONSE" | python3 -m json.tool
  exit 1
fi

echo "✅ Login successful"
echo "   Token: ${TOKEN:0:20}..."
echo ""

# Step 3: Create a test invoice
echo "📋 Step 3: Creating test invoice as designer..."
INVOICE_DATA='{
  "client": "692c3f797095d4fb773ff26c",
  "totalAmount": 1000,
  "deposit": 500,
  "items": [
    {
      "description": "TEST NOTIFICATION - Created at '$(date +"%Y-%m-%d %H:%M:%S")'",
      "quantity": 1,
      "price": 1000
    }
  ]
}'

INVOICE_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/invoices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "$INVOICE_DATA")

echo "$INVOICE_RESPONSE" | python3 -m json.tool
echo ""

INVOICE_ID=$(echo $INVOICE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['_id'])" 2>/dev/null)

if [ -z "$INVOICE_ID" ]; then
  echo "❌ Invoice creation failed!"
  exit 1
fi

echo "✅ Invoice created: $INVOICE_ID"
echo ""

# Step 4: Check notifications
echo "📋 Step 4: Checking designer notifications..."
sleep 2  # Wait for notifications to be created

NOTIFICATIONS=$(curl -s "${BACKEND_URL}/api/notifications" \
  -H "Authorization: Bearer ${TOKEN}")

echo "$NOTIFICATIONS" | python3 -m json.tool
echo ""

# Count unread notifications
UNREAD_COUNT=$(echo $NOTIFICATIONS | python3 -c "import sys, json; data=json.load(sys.stdin); print(len([n for n in data.get('data', []) if not n.get('isRead', False)]))" 2>/dev/null)

echo "📊 Summary:"
echo "   Unread notifications: $UNREAD_COUNT"
echo ""

if [ "$UNREAD_COUNT" -gt "0" ]; then
  echo "✅ SUCCESS! Designer received notifications"
else
  echo "❌ FAILED! Designer did not receive notifications"
  echo ""
  echo "🔍 Debugging steps:"
  echo "   1. Check Vercel function logs"
  echo "   2. Check MongoDB notifications collection"
  echo "   3. Verify notification creation code is being executed"
fi
