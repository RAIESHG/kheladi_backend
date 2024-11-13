#!/bin/bash

# Configure git
echo "Configuring git..."
read -p "Enter your Git username: " username
read -p "Enter your Git email: " email
read -p "Enter your GitHub repository name: " repo_name

git config --global user.name "$username"
git config --global user.email "$email"

# Initialize git
echo "Initializing git repository..."
git init
git add .
git commit -m "Initial commit"

# Create and switch to main branch
git branch -M main

# Add remote repository
echo "Adding remote repository..."
git remote add origin "git@github.com:$username/$repo_name.git"

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main

echo "Git setup and push complete!"

# Print next steps
echo "
Next steps:
1. Check your repository at: https://github.com/$username/$repo_name
2. Run './scripts/deploy.sh' to deploy to Netlify
" 