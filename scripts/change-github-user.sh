#!/bin/bash

echo "Changing GitHub User Configuration..."

# Remove old SSH keys
echo "Removing old SSH keys..."
rm -rf ~/.ssh/id_ed25519*

# Remove old git credentials
echo "Removing old git credentials..."
git config --global --unset user.name
git config --global --unset user.email
git config --global --unset credential.helper

# Set new git credentials
read -p "Enter new GitHub username: " github_username
read -p "Enter new GitHub email: " github_email

git config --global user.name "$github_username"
git config --global user.email "$github_email"

# Generate new SSH key
echo "Generating new SSH key..."
ssh-keygen -t ed25519 -C "$github_email"

# Start SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Display the public key
echo "
=== Your new SSH public key (copy this to GitHub) ==="
cat ~/.ssh/id_ed25519.pub
echo "
=== End of SSH public key ===

Please follow these steps:
1. Copy the SSH key above
2. Go to GitHub.com → Settings → SSH and GPG keys
3. Click 'New SSH key'
4. Paste the key and save
"

read -p "Press Enter after adding the SSH key to GitHub..."

# Test SSH connection
echo "Testing GitHub SSH connection..."
ssh -T git@github.com

# Update remote URL if needed
read -p "Do you want to update the remote URL for this repository? (y/n) " update_remote
if [ "$update_remote" = "y" ]; then
    read -p "Enter your repository name: " repo_name
    git remote set-url origin "git@github.com:$github_username/$repo_name.git"
    echo "Remote URL updated!"
fi

echo "
GitHub user change complete!
New configuration:
- Username: $github_username
- Email: $github_email
- SSH key: ~/.ssh/id_ed25519
" 