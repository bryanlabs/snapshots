import { Chain } from '@/lib/types';
import { ChainListClient } from './ChainListClient';

async function getChains(): Promise<Chain[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/chains`, {
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