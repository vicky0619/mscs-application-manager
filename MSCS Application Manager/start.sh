#!/bin/bash

echo "🚀 Starting MSCS Application Manager..."

# Check if backend is running
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ Backend is running on port 5001"
else
    echo "❌ Backend not running. Starting it now..."
    echo "Please run: npm run dev"
    exit 1
fi

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running on port 3000"
else
    echo "❌ Frontend not running. Starting it now..."
    python3 -m http.server 3000 &
    sleep 2
fi

echo ""
echo "🎉 MSCS Application Manager is ready!"
echo ""
echo "📱 Open in your browser:"
echo "   Main App: http://localhost:3000"
echo "   Test Page: http://localhost:3000/test.html"
echo ""
echo "🔑 Demo Login:"
echo "   Email: test@example.com"
echo "   Password: password123"
echo ""

# Try to open in default browser (macOS)
if command -v open > /dev/null; then
    echo "🌐 Opening in your default browser..."
    open http://localhost:3000
fi