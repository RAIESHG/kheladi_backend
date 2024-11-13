#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Create necessary directories
echo "Creating project structure..."
mkdir -p netlify/functions public

# Move files to correct locations
echo "Moving files to correct locations..."
mv payment.js netlify/functions/api.js

# Create .gitignore
echo "Creating .gitignore..."
echo "node_modules
.env
.netlify
.DS_Store
dist" > .gitignore

echo "Setup complete!" 