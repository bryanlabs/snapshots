import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Define thresholds for Web Vitals
const WEB_VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

// In-memory storage for demo purposes (replace with database or external service)
const vitalsStore: Map<string, any[]> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';

    // Add server-side metadata
    const vital = {
      ...body,
      ip: ip.split(',')[0], // Get first IP if multiple
      serverTimestamp: new Date().toISOString(),
    };

    // Store in memory (replace with proper storage)
    const url = vital.url || 'unknown';
    if (!vitalsStore.has(url)) {
      vitalsStore.set(url, []);
    }
    vitalsStore.get(url)?.push(vital);

    // Log for monitoring
    console.log(`[Web Vital] ${vital.name}: ${vital.value}ms (${vital.rating}) - ${url}`);

    // Send to external monitoring service if needed
    // await sendToMonitoringService(vital);

    // Check if the metric is poor and should trigger an alert
    if (vital.rating === 'poor') {
      console.warn(`[Web Vital Alert] Poor ${vital.name} performance: ${vital.value}ms on ${url}`);
      // Could trigger alerts here
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process web vital:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process metric' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve vitals (for debugging/dashboard)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (url && vitalsStore.has(url)) {
    const vitals = vitalsStore.get(url);
    const summary = calculateSummary(vitals || []);
    
    return NextResponse.json({
      success: true,
      data: {
        url,
        vitals: vitals?.slice(-100), // Last 100 entries
        summary,
      },
    });
  }

  // Return all URLs if no specific URL requested
  const allUrls = Array.from(vitalsStore.keys()).map(url => ({
    url,
    count: vitalsStore.get(url)?.length || 0,
    summary: calculateSummary(vitalsStore.get(url) || []),
  }));

  return NextResponse.json({
    success: true,
    data: allUrls,
  });
}

function calculateSummary(vitals: any[]) {
  const metrics = ['CLS', 'FCP', 'INP', 'LCP', 'TTFB'];
  const summary: Record<string, any> = {};

  metrics.forEach(metric => {
    const values = vitals
      .filter(v => v.name === metric)
      .map(v => v.value);

    if (values.length > 0) {
      summary[metric] = {
        count: values.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
        p75: values.sort((a, b) => a - b)[Math.floor(values.length * 0.75)],
        p95: values.sort((a, b) => a - b)[Math.floor(values.length * 0.95)],
        good: vitals.filter(v => v.name === metric && v.rating === 'good').length,
        needsImprovement: vitals.filter(v => v.name === metric && v.rating === 'needs-improvement').length,
        poor: vitals.filter(v => v.name === metric && v.rating === 'poor').length,
      };
    }
  });

  return summary;
}