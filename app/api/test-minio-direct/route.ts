import { NextRequest, NextResponse } from 'next/server';
import { getMinioClient } from '@/lib/minio/client';

export async function GET(request: NextRequest) {
  try {
    console.log('=== MINIO DIRECT TEST ===');
    const client = getMinioClient();
    console.log('MinIO client created');
    
    // Test 1: List all buckets
    console.log('Testing listBuckets...');
    const buckets = await client.listBuckets();
    console.log('Buckets found:', buckets.map(b => b.name));
    
    // Test 2: List all objects in snapshots bucket (like chains API)
    console.log('Testing listObjectsV2 for all objects...');
    const allObjects: any[] = [];
    const allStream = client.listObjectsV2('snapshots', '', true);
    
    await new Promise((resolve, reject) => {
      allStream.on('data', (obj) => {
        console.log('All objects - found:', obj.name);
        allObjects.push(obj.name);
      });
      allStream.on('error', reject);
      allStream.on('end', () => {
        console.log('All objects stream ended. Total:', allObjects.length);
        resolve(undefined);
      });
    });
    
    // Test 3: List objects with noble-1 prefix (like snapshots API)
    console.log('Testing listObjectsV2 with noble-1/ prefix...');
    const nobleObjects: any[] = [];
    const nobleStream = client.listObjectsV2('snapshots', 'noble-1/', true);
    
    await new Promise((resolve, reject) => {
      nobleStream.on('data', (obj) => {
        console.log('Noble objects - found:', obj.name);
        nobleObjects.push(obj.name);
      });
      nobleStream.on('error', (error) => {
        console.error('Noble stream error:', error);
        reject(error);
      });
      nobleStream.on('end', () => {
        console.log('Noble stream ended. Total:', nobleObjects.length);
        resolve(undefined);
      });
    });
    
    return NextResponse.json({
      success: true,
      buckets: buckets.map(b => b.name),
      allObjects,
      nobleObjects,
    });
  } catch (error) {
    console.error('MinIO direct test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}