'use client';

import { motion } from 'framer-motion';
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface User {
  personalTier?: { name: string };
  subscriptionStatus?: string;
}

interface PricingTiersProps {
  currentUser?: User | null;
}

const tiers = [
  {
    name: 'FREE',
    emoji: '🆓',
    price: 0,
    period: 'forever',
    bandwidth: '50 Mbps',
    bandwidthMultiplier: 'Community Tier',
    snapshots: 'Daily (12:00 UTC)',
    apiRequests: '50/hour',
    apiBurst: '10 burst',
    support: 'Community forums',
    features: [
      '50 Mbps shared bandwidth pool',
      'Daily snapshots (12:00 UTC only)',
      '50 API requests/hour (10 burst)',
      'Community forums support',
      'Download tracking with account',
      'All blockchain networks',
      'Standard pruned snapshots',
    ],
    cta: 'Get Started Free',
    ctaVariant: 'outline' as const,
    popular: false,
    gradient: 'from-slate-800 to-slate-700',
    borderGradient: 'border-slate-600',
  },
  {
    name: 'PREMIUM',
    emoji: '⚡',
    price: 25,
    period: 'month',
    bandwidth: '250 Mbps',
    bandwidthMultiplier: 'Professional Tier',
    snapshots: 'Twice daily (0:00, 12:00 UTC)',
    apiRequests: '500/hour',
    apiBurst: '100 burst',
    support: 'Telegram Channel Support',
    features: [
      '250 Mbps shared bandwidth pool',
      'Twice daily snapshots (0:00, 12:00 UTC)',
      '500 API requests/hour (100 burst)',
      'Premium Telegram group access',
      'Advanced analytics dashboard',
      'Priority download queue',
      'Extended URL expiry (24 hours)',
      'Telegram Channel Support',
    ],
    cta: 'Upgrade to Premium',
    ctaVariant: 'default' as const,
    popular: true,
    gradient: 'from-blue-900/80 to-purple-900/80',
    borderGradient: 'border-blue-500/50',
  },
  {
    name: 'ULTRA',
    emoji: '🚀',
    price: 125,
    period: 'month',
    bandwidth: '500 Mbps',
    bandwidthMultiplier: 'Enterprise Tier',
    snapshots: 'Every 6 hours (0, 6, 12, 18 UTC)',
    apiRequests: '2,000/hour',
    apiBurst: '500 burst',
    support: 'Private Telegram with Dan',
    features: [
      '500 Mbps shared bandwidth pool',
      'Every 6 hours snapshots (0, 6, 12, 18 UTC)',
      'Custom snapshot requests (any block height)',
      'Custom pruning configurations',
      '2,000 API requests/hour (500 burst)',
      'Private Telegram group with Dan',
      'Priority processing queue',
      'Extended URL expiry (48 hours)',
      'Phone support (weekdays)',
    ],
    cta: 'Go Ultra',
    ctaVariant: 'default' as const,
    popular: false,
    gradient: 'from-purple-900/80 to-pink-900/80',
    borderGradient: 'border-purple-500/50',
  },
];

export function PricingTiers({ currentUser }: PricingTiersProps) {
  const handleUpgrade = (tierName: string) => {
    if (tierName === 'FREE') {
      window.location.href = '/auth/signup';
    } else {
      // For paid tiers, redirect to contact page with upgrade tracking parameters
      // This allows the contact page to show Telegram invitation after successful upgrade
      const contactUrl = new URL('/contact', window.location.origin);
      contactUrl.searchParams.set('tier', tierName.toLowerCase());
      contactUrl.searchParams.set('source', 'pricing');
      window.location.href = contactUrl.toString();
    }
  };
  
  const getCurrentUserTier = () => {
    return currentUser?.personalTier?.name || 'free';
  };
  
  // Desktop-first professional 3-column layout
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
          Infrastructure Investment Tiers
        </h2>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-4">
          Professional blockchain infrastructure with performance guarantees and enterprise support
        </p>
        <p className="text-lg text-blue-300 max-w-2xl mx-auto">
          Choose the tier that matches your operational requirements and budget
        </p>
      </div>
      
      {/* Desktop 3-column comparison table */}
      <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {tiers.map((tier, index) => (
          <TierCard
            key={tier.name}
            tier={tier}
            currentUserTier={getCurrentUserTier()}
            onUpgrade={handleUpgrade}
          />
        ))}
      </div>
      
      {/* Professional Benefits Summary */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-8 max-w-6xl mx-auto border border-slate-700/50 mt-16">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">Enterprise Features Across All Tiers</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-3">⚡</div>
            <div className="font-semibold text-white mb-2">99.9% Uptime SLA</div>
            <p className="text-slate-300 text-sm">Enterprise-grade infrastructure with monitoring</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">🔒</div>
            <div className="font-semibold text-white mb-2">Secure Downloads</div>
            <p className="text-slate-300 text-sm">Authenticated URLs with expiry controls</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">📊</div>
            <div className="font-semibold text-white mb-2">Usage Analytics</div>
            <p className="text-slate-300 text-sm">Detailed bandwidth and download tracking</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">🌐</div>
            <div className="font-semibold text-white mb-2">Global CDN</div>
            <p className="text-slate-300 text-sm">Multi-region distribution for optimal speed</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual Tier Card Component
interface TierCardProps {
  tier: typeof tiers[0];
  currentUserTier: string;
  onUpgrade: (tierName: string) => void;
}

function TierCard({ tier, currentUserTier, onUpgrade }: TierCardProps) {
  const isCurrentTier = currentUserTier.toLowerCase() === tier.name.toLowerCase();
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -8 }}
      transition={{ duration: 0.3 }}
      className="relative h-full"
    >
      {tier.popular && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
            <SparklesIcon className="w-4 h-4" />
            RECOMMENDED
          </div>
        </div>
      )}
      
      <Card className={`relative overflow-hidden backdrop-blur-sm bg-gradient-to-br ${tier.gradient} border-2 ${tier.borderGradient} ${tier.popular ? 'ring-2 ring-blue-400/50 shadow-2xl shadow-blue-500/20' : 'shadow-xl'} h-full flex flex-col`}>
        <CardHeader className="text-center pb-6 pt-10">
          <div className="text-5xl mb-4">{tier.emoji}</div>
          <CardTitle className="text-3xl font-bold text-white mb-3">
            {tier.name}
          </CardTitle>
          <CardDescription className="text-slate-300 mb-2 text-lg font-medium">
            {tier.bandwidthMultiplier}
          </CardDescription>
          <CardDescription className="text-blue-300 mb-6">
            {tier.support}
          </CardDescription>
          
          {/* Pricing */}
          <div className="mb-8">
            {tier.price === 0 ? (
              <div className="text-5xl font-bold text-white">Free</div>
            ) : (
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-xl text-slate-400">$</span>
                <span className="text-5xl font-bold text-white">{tier.price}</span>
                <span className="text-xl text-slate-400">/{tier.period}</span>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          {/* Key Performance Metrics */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
              <div className="text-sm text-slate-400 mb-2 font-medium">Bandwidth Pool</div>
              <div className="text-xl font-bold text-white">{tier.bandwidth}</div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
              <div className="text-sm text-slate-400 mb-2 font-medium">Snapshot Frequency</div>
              <div className="text-xl font-bold text-white">{tier.snapshots}</div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
              <div className="text-sm text-slate-400 mb-2 font-medium">API Rate Limits</div>
              <div className="text-xl font-bold text-white">{tier.apiRequests}</div>
              <div className="text-sm text-blue-300 mt-1">({tier.apiBurst} burst)</div>
            </div>
          </div>
          
          {/* Features List */}
          <div className="space-y-4 mb-8 flex-1">
            <h4 className="text-lg font-semibold text-white mb-4">Infrastructure Features</h4>
            {tier.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                <span className="text-slate-300 leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>
          
          {/* CTA Button */}
          <div className="mt-auto">
            {isCurrentTier ? (
              <div className="bg-green-900/60 border-2 border-green-500/60 rounded-xl p-4 text-center">
                <div className="text-green-300 font-bold text-lg">Current Plan</div>
              </div>
            ) : (
              <Button
                onClick={() => onUpgrade(tier.name)}
                variant={tier.ctaVariant}
                size="lg"
                className={`w-full font-bold text-lg py-4 rounded-xl transition-all duration-300 ${
                  tier.ctaVariant === 'default'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                    : 'border-2 border-slate-500 hover:border-slate-400 hover:bg-slate-800/50'
                }`}
              >
                {tier.cta}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
