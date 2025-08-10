#!/bin/bash

# Run API tests locally and in CI

echo "🧪 Running API Tests"
echo "=================="

# Check if running in Docker or locally
if [ -f /.dockerenv ]; then
    echo "Running in Docker environment"
    BASE_URL="${BASE_URL:-http://webapp:3000}"
else
    echo "Running locally"
    BASE_URL="${BASE_URL:-http://localhost:3000}"
    
    # Check if dev server is running
    if ! curl -s "$BASE_URL/api/health" > /dev/null; then
        echo "⚠️  Dev server not running. Start with: npm run dev"
        exit 1
    fi
fi

# Run the test script
./test-api.sh

# Exit with test script's exit code
exit $?