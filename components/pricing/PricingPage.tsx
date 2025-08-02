'use client';

import { useAuth } from '@/hooks/useAuth';
import { PricingHero } from './PricingHero';
import { PricingTiers } from './PricingTiers';
import { BandwidthVisualization } from './BandwidthVisualization';
import { SnapshotTimeline } from './SnapshotTimeline';
import { CommunityAccess } from './CommunityAccess';
import { ValueCalculators } from './ValueCalculators';
import { PricingFAQ } from './PricingFAQ';
import { PricingPerformance } from './PricingPerformance';

export function PricingPage() {
  const { user, session } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Desktop-first professional container */}
      <div className="container mx-auto px-6 lg:px-8 pt-12 pb-20">
        {/* Hero Section */}
        <PricingHero />
        
        {/* Pricing Tiers - Desktop-first professional design */}
        <section className="mt-20 mb-24">
          <PricingTiers currentUser={user} />
        </section>
        
        {/* Performance Guarantees */}
        <section className="mt-24 mb-24">
          <BandwidthVisualization />
        </section>
        
        {/* Snapshot Freshness Timeline */}
        <section className="mt-24 mb-24">
          <SnapshotTimeline />
        </section>
        
        {/* Professional Support & Community Access */}
        <section className="mt-24 mb-24">
          <CommunityAccess />
        </section>
        
        {/* ROI & Value Calculators */}
        <section className="mt-24 mb-24">
          <ValueCalculators />
        </section>
        
        {/* FAQ Section */}
        <section className="mt-24 mb-24">
          <PricingFAQ />
        </section>
        
        {/* Professional CTA Section */}
        <section className="mt-24">
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm rounded-3xl p-12 border border-blue-500/30 text-center max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-6">
              Ready to Scale Your Infrastructure?
            </h3>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join validator operators and DevOps teams who trust our enterprise-grade snapshot infrastructure for their critical blockchain operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.href = '/contact?source=pricing-cta'}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Contact Sales
              </button>
              <button 
                onClick={() => window.location.href = '/auth/signup'}
                className="border-2 border-slate-500 hover:border-slate-400 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:bg-slate-800/50"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </section>
      </div>
      
      {/* Performance Monitoring (dev only) */}
      <PricingPerformance />
    </div>
  );
}
