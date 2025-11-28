#!/bin/bash

echo "🧪 Testing Vercel Deployment Fixes..."
echo "======================================"

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Please run this script from the root of the Sendroli_Group project"
    exit 1
fi

cd frontend

echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🌐 Starting preview server..."
    echo "   Your site will be available at: http://localhost:4173"
    echo "   Press Ctrl+C to stop"
    echo ""
    npm run preview
else
    echo "❌ Build failed! Check the errors above."
    echo ""
    echo "Common fixes:"
    echo "1. Make sure all environment variables are set"
    echo "2. Check for TypeScript/syntax errors"
    echo "3. Verify all dependencies are installed"
fi