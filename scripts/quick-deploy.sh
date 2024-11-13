#!/bin/bash

echo "Quick Deploy Script"
echo "==================="

# Check if there are changes to commit
if [ -n "$(git status --porcelain)" ]; then
    # Changes exist
    echo "Changes detected. Committing..."
    
    # Get commit message from user
    read -p "Enter commit message (default: 'Update'): " commit_message
    commit_message=${commit_message:-"Update"}
    
    # Add and commit changes
    git add .
    git commit -m "$commit_message"
    
    # Push to GitHub
    echo "Pushing to GitHub..."
    git push origin main
else
    echo "No changes detected in git."
fi

# Deploy to Netlify
echo "Deploying to Netlify..."
netlify deploy --prod

echo "Quick deploy complete!"
echo "===================="
echo "Check your deployment at your Netlify URL" 