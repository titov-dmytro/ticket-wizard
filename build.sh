#!/bin/bash

# Clean build script for AWS Amplify deployment
echo "Starting clean build process..."

# Remove node_modules and package-lock.json for fresh install
rm -rf node_modules
rm -f package-lock.json

# Clear npm cache
npm cache clean --force

# Install dependencies with legacy peer deps
npm install --legacy-peer-deps

# Run build
npm run build

echo "Build process completed!"
