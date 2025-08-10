import { NextRequest, NextResponse } from 'next/server';
import { captureException, captureMessage, withSentry } from '@/lib/sentry';

// Example API route with Sentry error tracking
async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    switch (type) {
      case 'error':
        // Simulate an error
        throw new Error('This is a test error for Sentry');
        
      case 'warning':
        // Log a warning message
        captureMessage('This is a test warning', {
          testContext: {
            timestamp: new Date().toISOString(),
            userAgent: request.headers.get('user-agent'),
          },
        }, 'warning');
        
        return NextResponse.json({
          success: true,
          message: 'Warning logged to Sentry',
        });
        
      case 'custom':
        // Custom error with context
        const customError = new Error('Custom error with additional context');
        captureException(customError, {
          request: {
            method: request.method,
            url: request.url,
            headers: Object.fromEntries(request.headers.entries()),
          },
          custom: {
            testType: 'custom_error_test',
            timestamp: new Date().toISOString(),
          },
        });
        
        throw customError;
        
      default:
        return NextResponse.json({
          success: true,
          message: 'Test endpoint working. Add ?type=error, ?type=warning, or ?type=custom to test Sentry',
        });
    }
  } catch (error) {
    // Error will be captured by withSentry wrapper
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Wrap the handler with Sentry monitoring
export const GET = withSentry(handler, {
  name: 'api.test-error',
  op: 'http.server',
});

export const POST = withSentry(handler, {
  name: 'api.test-error',
  op: 'http.server',
});