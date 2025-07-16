#!/bin/bash

# Test script for the new programmatic URL retrieval API

API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
CHAIN_ID="${CHAIN_ID:-osmosis}"

echo "Testing Programmatic URL Retrieval API"
echo "======================================"
echo ""

# Test 1: Free tier (no auth header)
echo "Test 1: Free tier request (no auth header)"
echo "GET $API_BASE_URL/api/v1/chains/$CHAIN_ID/snapshots/latest"
echo ""
curl -s "$API_BASE_URL/api/v1/chains/$CHAIN_ID/snapshots/latest" | jq '.'
echo ""
echo "---"
echo ""

# Test 2: Get JWT token
echo "Test 2: Login and get JWT token"
echo "POST $API_BASE_URL/api/v1/auth/login"
echo ""

# You'll need to set these environment variables with actual credentials
PREMIUM_USERNAME="${PREMIUM_USERNAME:-premium_user}"
PREMIUM_PASSWORD="${PREMIUM_PASSWORD:-your_password}"

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$PREMIUM_USERNAME\", \"password\": \"$PREMIUM_PASSWORD\", \"return_token\": true}")

echo "$LOGIN_RESPONSE" | jq '.'

# Extract token if login successful
if echo "$LOGIN_RESPONSE" | jq -e '.success' > /dev/null; then
  JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token.access_token')
  echo ""
  echo "JWT Token obtained successfully"
  echo ""
  echo "---"
  echo ""
  
  # Test 3: Premium tier (with auth header)
  echo "Test 3: Premium tier request (with Bearer token)"
  echo "GET $API_BASE_URL/api/v1/chains/$CHAIN_ID/snapshots/latest"
  echo "Authorization: Bearer <token>"
  echo ""
  curl -s "$API_BASE_URL/api/v1/chains/$CHAIN_ID/snapshots/latest" \
    -H "Authorization: Bearer $JWT_TOKEN" | jq '.'
  echo ""
  echo "---"
  echo ""
else
  echo "Login failed. Cannot test premium tier."
fi

# Test 4: Invalid chain
echo "Test 4: Invalid chain ID"
echo "GET $API_BASE_URL/api/v1/chains/invalid-chain/snapshots/latest"
echo ""
curl -s "$API_BASE_URL/api/v1/chains/invalid-chain/snapshots/latest" | jq '.'
echo ""
echo "---"
echo ""

# Test 5: Invalid auth token
echo "Test 5: Invalid Bearer token"
echo "GET $API_BASE_URL/api/v1/chains/$CHAIN_ID/snapshots/latest"
echo "Authorization: Bearer invalid-token"
echo ""
curl -s "$API_BASE_URL/api/v1/chains/$CHAIN_ID/snapshots/latest" \
  -H "Authorization: Bearer invalid-token" | jq '.'

echo ""
echo "Testing complete!"