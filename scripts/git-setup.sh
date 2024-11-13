#!/bin/bash

echo "Setting up Git repository..."

# Check for SSH key
if [ ! -f ~/.ssh/id_ed25519 ]; then
    echo "SSH key not found. Generating new SSH key..."
    ssh-keygen -t ed25519 -C "raieshg@gmail.com"
    
    # Start ssh-agent and add key
    eval "$(ssh-agent -s)"
    ssh-add ~/.ssh/id_ed25519
    
    # Display public key
    echo "Please add this SSH key to your GitHub account (https://github.com/settings/keys):"
    cat ~/.ssh/id_ed25519.pub
    
    # Wait for user to add key
    read -p "Press enter after adding the SSH key to GitHub..."
fi

# Remove existing remote if it exists
if git remote | grep -q 'origin'; then
    echo "Removing existing remote..."
    git remote remove origin
fi

# Initialize git if not already initialized
if [ ! -d .git ]; then
    git init
fi

# Configure git
git config user.name "RAIESHG"
git config user.email "raieshg@gmail.com"

# Add all files
git add .

# Commit changes
git commit -m "Initial commit"

# Switch to main branch
git branch -M main

# Add new remote using SSH URL
git remote add origin git@github.com:RAIESHG/kheladi_backend.git

# Test SSH connection
echo "Testing GitHub SSH connection..."
ssh -T git@github.com

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main

echo "Git setup complete!"