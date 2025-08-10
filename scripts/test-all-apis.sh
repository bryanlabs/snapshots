#!/bin/bash

# Snapshots Service API Testing Script
# This script tests all API endpoints to ensure they work correctly
# Run this before and after making changes to verify nothing breaks

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="snapshot123"
CHAIN_ID="noble-1"
PREMIUM_USER="premium_user"
PREMIUM_PASS="${PREMIUM_PASSWORD:-premium123}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

log_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local auth_header=$4
    local data=$5
    
    log_info "Testing: $description"
    
    if [ "$method" = "GET" ]; then
        if [ -z "$auth_header" ]; then
            response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -H "$auth_header" "$BASE_URL$endpoint")
        fi
    else
        if [ -z "$auth_header" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -H "$auth_header" -d "$data" "$BASE_URL$endpoint")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
        log_success "$description (HTTP $http_code)"
        echo "$body" | jq -C '.' 2>/dev/null || echo "$body"
    else
        log_error "$description (HTTP $http_code)"
        echo "$body" | jq -C '.' 2>/dev/null || echo "$body"
    fi
    
    echo ""
}

# Save responses for later use
save_response() {
    local name=$1
    local value=$2
    eval "$name='$value'"
}

echo "=========================================="
echo "Snapshots Service API Test Suite"
echo "Base URL: $BASE_URL"
echo "=========================================="
echo ""

# 1. Test Public API Endpoints
echo "=== Testing Public API (v1) ==="

test_endpoint "GET" "/api/v1/chains" "List all chains"

test_endpoint "GET" "/api/v1/chains/$CHAIN_ID" "Get specific chain"

test_endpoint "GET" "/api/v1/chains/$CHAIN_ID/info" "Get chain info"

test_endpoint "GET" "/api/v1/chains/$CHAIN_ID/snapshots" "List snapshots"

test_endpoint "GET" "/api/v1/chains/$CHAIN_ID/snapshots/latest" "Get latest snapshot"

# Get a filename for download test
log_info "Getting latest snapshot filename..."
latest_snapshot=$(curl -s "$BASE_URL/api/v1/chains/$CHAIN_ID/snapshots/latest" | jq -r '.data.fileName')
log_success "Latest snapshot: $latest_snapshot"

test_endpoint "POST" "/api/v1/chains/$CHAIN_ID/download" "Request download URL (anonymous)" "" "{\"filename\":\"$latest_snapshot\"}"

# 2. Test Legacy Authentication
echo ""
echo "=== Testing Legacy Authentication ==="

# Login with legacy auth
log_info "Testing legacy login..."
login_response=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"username\":\"$PREMIUM_USER\",\"password\":\"$PREMIUM_PASS\"}" \
    "$BASE_URL/api/v1/auth/login")

jwt_token=$(echo "$login_response" | jq -r '.data.token' 2>/dev/null || echo "")

if [ -n "$jwt_token" ] && [ "$jwt_token" != "null" ]; then
    log_success "Legacy login successful"
    auth_header="Authorization: Bearer $jwt_token"
    
    test_endpoint "GET" "/api/v1/auth/me" "Get current user (JWT)" "$auth_header"
    
    test_endpoint "POST" "/api/v1/chains/$CHAIN_ID/download" "Request download URL (premium)" "$auth_header" "{\"filename\":\"$latest_snapshot\"}"
    
    test_endpoint "POST" "/api/v1/auth/logout" "Logout" "$auth_header"
else
    log_error "Legacy login failed"
fi

# 3. Test NextAuth Authentication
echo ""
echo "=== Testing NextAuth Authentication ==="

# Get CSRF token
log_info "Getting CSRF token..."
csrf_response=$(curl -s -c cookies.txt "$BASE_URL/api/auth/csrf")
csrf_token=$(echo "$csrf_response" | jq -r '.csrfToken')
log_success "CSRF token obtained"

# Test session (should be empty)
test_endpoint "GET" "/api/auth/session" "Get session (unauthenticated)"

# List providers
test_endpoint "GET" "/api/auth/providers" "List auth providers"

# 4. Test System Endpoints
echo ""
echo "=== Testing System Endpoints ==="

test_endpoint "GET" "/api/health" "Health check"

test_endpoint "GET" "/api/bandwidth/status" "Bandwidth status"

test_endpoint "GET" "/api/v1/downloads/status" "Download status (anonymous)"

# 5. Test Account Endpoints (requires auth)
echo ""
echo "=== Testing Account Endpoints ==="

# These will fail without auth, which is expected
test_endpoint "GET" "/api/account/avatar" "Get avatar (should fail without auth)"

# 6. Test Admin Endpoints (requires admin auth)
echo ""
echo "=== Testing Admin Endpoints ==="

# These will fail without admin auth, which is expected
test_endpoint "GET" "/api/admin/stats" "Admin stats (should fail without admin)"

test_endpoint "GET" "/api/admin/downloads" "Download analytics (should fail without admin)"

# 7. Test Error Handling
echo ""
echo "=== Testing Error Handling ==="

test_endpoint "GET" "/api/v1/chains/invalid-chain" "Invalid chain (should 404)"

test_endpoint "POST" "/api/v1/chains/$CHAIN_ID/download" "Download with invalid filename" "" "{\"filename\":\"invalid-file.tar.gz\"}"

test_endpoint "GET" "/api/v1/chains/$CHAIN_ID/snapshots?limit=abc" "Invalid query parameter"

# 8. Test Rate Limiting
echo ""
echo "=== Testing Rate Limiting ==="

log_info "Making rapid requests to test rate limiting..."
for i in {1..5}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/chains")
    if [ "$response" = "429" ]; then
        log_success "Rate limiting working (429 response)"
        break
    fi
done

# Summary
echo ""
echo "=========================================="
echo "API Test Suite Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review any failed tests above"
echo "2. Run this script after implementing changes"
echo "3. Compare results to ensure no regressions"
echo "4. Add new tests for any new endpoints"

# Clean up
rm -f cookies.txt