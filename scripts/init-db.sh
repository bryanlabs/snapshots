#!/bin/sh

echo "Starting application..."

# Check if database needs initialization
if [ ! -f /app/prisma/dev.db ] || [ ! -s /app/prisma/dev.db ]; then
  echo "Initializing database..."
  
  # Create database file with proper permissions
  touch /app/prisma/dev.db
  
  # Initialize schema using SQLite
  sqlite3 /app/prisma/dev.db < /app/prisma/init.sql
  
  echo "Database initialized"
fi

# Start the application
exec node server.js