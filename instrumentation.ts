import { validateRequiredEnvVars } from './lib/env-validation';

export async function register() {
  // Validate environment variables on startup
  // This runs before the app starts serving requests
  if (process.env.NODE_ENV === 'production') {
    try {
      validateRequiredEnvVars();
    } catch (error) {
      console.error('❌ Environment validation failed:', error);
      process.exit(1);
    }
  }
}