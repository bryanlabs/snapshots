import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// In-memory storage for demo (replace with proper analytics service)
const rumStore: Map<string, any[]> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';

    // Add server metadata
    const event = {
      ...body,
      ip: ip.split(',')[0],
      serverTimestamp: new Date().toISOString(),
    };

    // Store by event type
    const eventType = event.type || 'unknown';
    if (!rumStore.has(eventType)) {
      rumStore.set(eventType, []);
    }
    rumStore.get(eventType)?.push(event);

    // Log significant events
    if (event.type === 'error') {
      console.error('[RUM Error]', event.error);
    } else if (event.type === 'timing' && event.metrics?.pageLoad > 5000) {
      console.warn('[RUM Slow Page]', event.url, `${event.metrics.pageLoad}ms`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process RUM event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process event' },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving RUM data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '100');

  if (type && rumStore.has(type)) {
    const events = rumStore.get(type) || [];
    return NextResponse.json({
      success: true,
      data: {
        type,
        count: events.length,
        events: events.slice(-limit),
      },
    });
  }

  // Return summary of all event types
  const summary = Array.from(rumStore.entries()).map(([type, events]) => ({
    type,
    count: events.length,
    lastEvent: events[events.length - 1]?.timestamp,
  }));

  return NextResponse.json({
    success: true,
    data: summary,
  });
}