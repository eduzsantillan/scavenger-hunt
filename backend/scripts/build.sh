#!/bin/bash
set -e

# Build script for the backend application
echo "Building backend application..."

# Install dependencies
npm install

# Compile TypeScript to JavaScript
echo "Compiling TypeScript to JavaScript..."
npm run build

# Create Elastic Beanstalk deployment package
echo "Creating deployment package..."
mkdir -p dist/node_modules
cp -R node_modules/* dist/node_modules/
cp package.json dist/
cp .env.example dist/.env

# Create the deployment zip file
cd dist
zip -r ../deployment.zip .

echo "Build completed successfully!"
