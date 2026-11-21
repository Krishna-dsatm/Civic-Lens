#!/bin/bash
echo "======================================================================"
echo "         CivicLens -- AI Triage for Citizen Complaints"
echo "======================================================================"

# Add portable node if exists
if [ -d "./.tools/node" ]; then
    export PATH="$(pwd)/.tools/node:$PATH"
fi

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not found. Please install Node.js 18+."
    exit 1
fi

echo "[1/2] Starting CivicLens Full-Stack Application on http://localhost:5000..."
echo "Citizen Portal   : http://localhost:5000"
echo "Admin Dashboard  : http://localhost:5000"
echo "API Health Check : http://localhost:5000/api/health"
echo "======================================================================"

node backend/server.js
