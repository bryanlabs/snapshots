/**
 * Validates that all required environment variables are present
 * This should be called early in the application startup
 */
export function validateRequiredEnvVars() {
  const requiredVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'DATABASE_URL',
    'SECURE_LINK_SECRET',
    'NGINX_ENDPOINT',
    'NGINX_PORT',
    'NGINX_EXTERNAL_URL',
    'REDIS_HOST',
    'REDIS_PORT',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please ensure all required environment variables are set in your .env file or environment.'
    );
  }

  // Validate NEXTAUTH_URL format
  try {
    new URL(process.env.NEXTAUTH_URL!);
  } catch {
    throw new Error('NEXTAUTH_URL must be a valid URL');
  }

  // Validate numeric environment variables
  const numericVars = ['NGINX_PORT', 'REDIS_PORT'];
  for (const varName of numericVars) {
    const value = process.env[varName];
    if (value && isNaN(parseInt(value))) {
      throw new Error(`${varName} must be a valid number`);
    }
  }

  console.log('✅ All required environment variables validated successfully');
}