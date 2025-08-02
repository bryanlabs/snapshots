import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Chains | Blockchain Snapshots',
  description: 'Browse all available blockchain snapshots for Cosmos ecosystem chains',
};

/**
 * Chains listing page - redirects to root page where ChainListServer displays all chains
 * This page exists to handle the /chains route from dashboard navigation
 */
export default function ChainsPage() {
  // Redirect to root page where the actual chain list is displayed
  redirect('/');
}