#!/bin/bash

echo "=================================="
echo "  FoodFlow Quick Start Script"
echo "=================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install it first."
    echo "   Download from: https://www.postgresql.org/download/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✓ PostgreSQL found: $(psql --version | head -n 1)"
echo "✓ Node.js found: $(node --version)"
echo "✓ npm found: $(npm --version)"
echo ""

# Create database
echo "Setting up database..."
echo "Please enter your PostgreSQL password when prompted"
psql -U postgres -c "CREATE DATABASE foodflow_db;" 2>/dev/null || echo "Database may already exist"
echo ""

# Setup backend
echo "Setting up backend..."
cd backend
npm install
echo ""

echo "Initializing database with tables and sample data..."
npm run init-db
echo ""

# Setup frontend
echo "Setting up frontend..."
cd ../frontend
npm install
echo ""

echo "=================================="
echo "  Setup Complete!"
echo "=================================="
echo ""
echo "To start the application:"
echo ""
echo "1. Start Backend (in terminal 1):"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "2. Start Frontend (in terminal 2):"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "3. Open http://localhost:3000"
echo ""
echo "Demo Accounts:"
echo "  Admin    - admin/admin123"
echo "  Customer - customer1/admin123"
echo ""
echo "=================================="
