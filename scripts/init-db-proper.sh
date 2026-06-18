#!/bin/sh
set -eu

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Seeding required tier and system rows..."
node /app/scripts/seed-db.js

echo "Database ready, starting application..."
exec node server.js
