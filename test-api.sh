#!/bin/bash

# API Testing Script for Snapshots Service
# Run this locally or in CI/CD

BASE_URL="${BASE_URL:-http://localhost:3000}"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="testpass123456"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧪 Testing Snapshots API at $BASE_URL"
echo "=================================="

# Test 1: Health Check
echo -e "\n${YELLOW}Test 1: Health Check${NC}"
HEALTH=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health")
STATUS_CODE=$(echo "$HEALTH" | tail -n1)
if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed (HTTP $STATUS_CODE)${NC}"
fi

# Test 2: User Registration
echo -e "\n${YELLOW}Test 2: User Registration${NC}"
REGISTER=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"displayName\":\"Test User\"}")
STATUS_CODE=$(echo "$REGISTER" | tail -n1)
RESPONSE=$(echo "$REGISTER" | head -n-1)
if [ "$STATUS_CODE" = "200" ]; then
    USER_ID=$(echo "$RESPONSE" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✓ User created: $USER_ID${NC}"
else
    echo -e "${RED}✗ Registration failed (HTTP $STATUS_CODE)${NC}"
    echo "$RESPONSE"
fi

# Test 3: Duplicate Registration (should fail)
echo -e "\n${YELLOW}Test 3: Duplicate Registration${NC}"
DUPLICATE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
STATUS_CODE=$(echo "$DUPLICATE" | tail -n1)
if [ "$STATUS_CODE" = "400" ]; then
    echo -e "${GREEN}✓ Duplicate rejection working${NC}"
else
    echo -e "${RED}✗ Duplicate not rejected (HTTP $STATUS_CODE)${NC}"
fi

# Test 4: Get CSRF Token
echo -e "\n${YELLOW}Test 4: Get CSRF Token${NC}"
CSRF_RESPONSE=$(curl -s -c cookies.txt "$BASE_URL/api/auth/csrf")
CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
if [ -n "$CSRF_TOKEN" ]; then
    echo -e "${GREEN}✓ CSRF token obtained${NC}"
else
    echo -e "${RED}✗ Failed to get CSRF token${NC}"
fi

# Test 5: Sign In
echo -e "\n${YELLOW}Test 5: Sign In${NC}"
SIGNIN=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/callback/credentials" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -b cookies.txt \
    -c cookies.txt \
    -L \
    -d "csrfToken=$CSRF_TOKEN&email=$TEST_EMAIL&password=$TEST_PASSWORD")
STATUS_CODE=$(echo "$SIGNIN" | tail -n1)
if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Sign in successful${NC}"
else
    echo -e "${RED}✗ Sign in failed (HTTP $STATUS_CODE)${NC}"
fi

# Test 6: Get Session
echo -e "\n${YELLOW}Test 6: Get Session${NC}"
SESSION=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/auth/session" \
    -b cookies.txt)
STATUS_CODE=$(echo "$SESSION" | tail -n1)
RESPONSE=$(echo "$SESSION" | head -n-1)
if [ "$STATUS_CODE" = "200" ] && echo "$RESPONSE" | grep -q "$TEST_EMAIL"; then
    echo -e "${GREEN}✓ Session valid${NC}"
else
    echo -e "${RED}✗ Session invalid (HTTP $STATUS_CODE)${NC}"
fi

# Test 7: List Chains
echo -e "\n${YELLOW}Test 7: List Chains${NC}"
CHAINS=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/v1/chains")
STATUS_CODE=$(echo "$CHAINS" | tail -n1)
if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Chains listed${NC}"
else
    echo -e "${RED}✗ Failed to list chains (HTTP $STATUS_CODE)${NC}"
fi

# Test 8: Get Snapshots
echo -e "\n${YELLOW}Test 8: Get Snapshots${NC}"
SNAPSHOTS=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/v1/chains/osmosis/snapshots")
STATUS_CODE=$(echo "$SNAPSHOTS" | tail -n1)
if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Snapshots retrieved${NC}"
else
    echo -e "${RED}✗ Failed to get snapshots (HTTP $STATUS_CODE)${NC}"
fi

# Test 9: Delete Account
echo -e "\n${YELLOW}Test 9: Delete Account${NC}"
DELETE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/auth/delete-account" \
    -b cookies.txt)
STATUS_CODE=$(echo "$DELETE" | tail -n1)
if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Account deleted${NC}"
else
    echo -e "${RED}✗ Failed to delete account (HTTP $STATUS_CODE)${NC}"
fi

# Clean up
rm -f cookies.txt

echo -e "\n=================================="
echo "🎉 API Testing Complete!"