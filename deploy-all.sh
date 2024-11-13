#!/bin/bash

# Make scripts executable
chmod +x scripts/*.sh

# Run each script in order
echo "Starting deployment process..."

./scripts/setup.sh
./scripts/git-setup.sh
./scripts/deploy.sh
./scripts/env-setup.sh

echo "Deployment process complete!" 