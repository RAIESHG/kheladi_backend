#!/bin/bash

# Login to Netlify
echo "Logging into Netlify..."
netlify login

# Initialize Netlify site
echo "Initializing Netlify site..."
netlify init

# Deploy to production
echo "Deploying to production..."
netlify deploy --prod

echo "Deployment complete!" 