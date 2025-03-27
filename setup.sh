#!/bin/bash

# Print heading
echo "==============================================="
echo "  GlitchMixer Setup Script"
echo "==============================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version $NODE_VERSION detected. Please upgrade to v16 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo ""
echo "📦 Installing npm dependencies..."
npm install

# Check if everything installed correctly
if [ $? -ne 0 ]; then
    echo "❌ Error installing dependencies. Please check your npm setup."
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "🚀 You can now start the development server with:"
echo "   npm run dev"
echo ""
echo "==============================================="
echo ""

# Ask if user wants to start the server
read -p "Would you like to start the development server now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run dev
fi 