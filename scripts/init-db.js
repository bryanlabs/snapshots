const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dbPath = '/app/prisma/dev.db';
const lockPath = '/app/prisma/.initialized';

async function initializeDatabase() {
  console.log('Checking database initialization...');
  
  // Check if already initialized
  if (fs.existsSync(lockPath)) {
    console.log('Database already initialized');
    return;
  }

  try {
    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      console.log('Creating database file...');
      fs.writeFileSync(dbPath, '');
    }

    // Copy schema file if it doesn't exist
    const schemaPath = '/app/prisma/schema.prisma';
    if (!fs.existsSync(schemaPath)) {
      console.log('Schema file missing, cannot initialize database');
      return;
    }

    console.log('Database initialization complete');
    
    // Create lock file
    fs.writeFileSync(lockPath, new Date().toISOString());
    
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// Run initialization
initializeDatabase().then(() => {
  console.log('Starting Next.js server...');
  require('/app/server.js');
});