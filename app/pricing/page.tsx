import { Metadata } from 'next';
import { Suspense } from 'react';
import { PricingPage } from '@/components/pricing/PricingPage';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const metadata: Metadata = {
  title: 'Enterprise Blockchain Infrastructure Pricing - Professional Snapshot Services',
  description: 'Professional blockchain infrastructure for validator operators, DevOps teams, and Cosmos developers. Enterprise tiers with performance guarantees: Free (50 Mbps), Premium ($25/mo, 250 Mbps), Ultra ($125/mo, 500 Mbps, custom snapshots).',
  keywords: [
    'validator operators snapshots',
    'enterprise blockchain infrastructure',
    'cosmos devops team',
    'professional blockchain snapshots',
    'guaranteed bandwidth tiers',
    'custom snapshot requests',
    'infrastructure investment',
    'blockchain devops tools',
    'validator node setup',
    'cosmos developer tools'
  ],
  openGraph: {
    title: 'Enterprise Blockchain Infrastructure Pricing',
    description: 'Professional snapshot services for validator operators and DevOps teams. Performance guarantees, priority support, and enterprise-grade reliability.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Enterprise Blockchain Infrastructure Pricing',
    description: 'Professional snapshot services for validator operators and DevOps teams. Performance guarantees, priority support, and enterprise-grade reliability.',
  },
  alternates: {
    canonical: '/pricing',
  },
};

export default function Pricing() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      <PricingPage />
    </Suspense>
  );
}
