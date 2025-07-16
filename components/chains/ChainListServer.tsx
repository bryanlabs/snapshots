import { Chain } from '@/lib/types';
import { ChainListClient } from './ChainListClient';

async function getChains(): Promise<Chain[]> {
  try {
    // For server-side requests, use internal URL
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? 'http://webapp:3000'  // Internal Kubernetes service URL
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
      
    const response = await fetch(`${apiUrl}/api/v1/chains`, {
      next: { revalidate: 60 } // Cache for 1 minute
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch chains');
    }
    
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Failed to fetch chains:', error);
    return [];
  }
}

export async function ChainListServer() {
  const chains = await getChains();
  
  return <ChainListClient initialChains={chains} />;
}