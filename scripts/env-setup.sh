#!/bin/bash

# Set up environment variables
echo "Setting up environment variables..."

read -p "Enter your FonePay PID: " pid
read -p "Enter your FonePay Secret Key: " secret_key
read -p "Enter your site URL (without trailing slash): " site_url

netlify env:set FONEPAY_PID "$pid"
netlify env:set FONEPAY_SECRET_KEY "$secret_key"
netlify env:set RETURN_URL "$site_url/.netlify/functions/api/verify-payment"

echo "Environment variables set!" 