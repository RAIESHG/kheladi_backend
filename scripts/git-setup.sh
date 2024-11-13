#!/bin/bash

echo "Setting up Git repository..."

# Remove existing remote if it exists
git remote remove origin

# Initialize git if not already initialized
if [ ! -d .git ]; then
    git init
fi

# Add all files
git add .

# Commit changes
git commit -m "first commit"

# Switch to main branch
git branch -M main

# Add new remote
git remote add origin git@github.com:RAIESHG/kheladi_backend.git

# Push to GitHub
git push -u origin main

echo "Git setup complete!"