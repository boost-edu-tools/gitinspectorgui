#!/bin/bash

# GitInspectorGUI Development Setup Script
# This script sets up the development environment for the proof-of-concept

set -e

echo "🚀 Setting up GitInspectorGUI development environment..."

# Check if required tools are installed
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

# Check Rust
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust is not installed. Please install Rust and try again."
    echo "   Visit: https://rustup.rs/"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.12+ and try again."
    exit 1
fi

echo "✅ All prerequisites found!"

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
# Install Python dependencies using uv
echo "📦 Installing Python dependencies with uv..."
uv sync

# Install Tauri CLI if not already installed
echo "🦀 Installing Tauri CLI..."
if ! command -v cargo-tauri &> /dev/null; then
    cargo install tauri-cli
fi

echo "🎉 Development environment setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Run 'npm run tauri:dev' to start the development server"
echo "   2. The application will open automatically"
echo "   3. Try configuring some settings and running an analysis"
echo ""
echo "🔧 Available commands:"
echo "   npm run tauri:dev    - Start development server"
echo "   npm run tauri:build  - Build production app"
echo "   npm run dev          - Start frontend only"
echo ""
echo "📖 For more information, see README.md and IMPLEMENTATION_PLAN.md"