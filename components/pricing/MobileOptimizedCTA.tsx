'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/CopyButton';
import { useMobileDetect } from '@/hooks/useMobileDetect';
import { SparklesIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

interface User {
  personalTier?: { name: string };
  subscriptionStatus?: string;
}

interface MobileOptimizedCTAProps {
  currentUser?: User | null;
}

export function MobileOptimizedCTA({ currentUser }: MobileOptimizedCTAProps) {
  const isMobile = useMobileDetect();
  const currentTier = currentUser?.personalTier?.name?.toLowerCase() || 'free';
  
  const handleUpgrade = (tier: string) => {
    if (tier === 'free') {
      window.location.href = '/auth/signup';
    } else {
      window.location.href = '/contact';
    }
  };
  
  const getRecommendedTier = () => {
    if (currentTier === 'free') return 'premium';
    if (currentTier === 'premium') return 'ultra';
    return null; // Already on highest tier
  };
  
  const recommendedTier = getRecommendedTier();
  
  if (!recommendedTier) {
    // User is already on Ultra tier
    return (
      <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/50">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            You're on the Ultra Tier!
          </h2>
          <p className="text-purple-200 mb-4">
            Thanks for being a premium customer. Need help or have feedback?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://t.me/danbryan80"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              📨 Message Dan directly
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
            >
              📞 Contact Support
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/50 overflow-hidden">
      <CardContent className="p-0">
        {/* Mobile-First CTA */}
        <div className="p-6">
          <div className="text-center mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-4xl mb-4"
            >
              {recommendedTier === 'premium' ? '⚡' : '🚀'}
            </motion.div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Ready to {recommendedTier === 'premium' ? 'Go Premium' : 'Go Ultra'}?
            </h2>
            
            <p className="text-lg text-slate-300 mb-4">
              {recommendedTier === 'premium' 
                ? 'Join 100+ professionals with 5x faster downloads'
                : 'Get the ultimate experience with 10x speed + custom snapshots'
              }
            </p>
            
            {/* Key Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-sm">
              {recommendedTier === 'premium' ? (
                <>
                  <div className="flex items-center gap-2 text-blue-300">
                    <SparklesIcon className="w-4 h-4" />
                    <span>250 Mbps guaranteed</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-300">
                    <SparklesIcon className="w-4 h-4" />
                    <span>Twice daily snapshots</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-300">
                    <SparklesIcon className="w-4 h-4" />
                    <span>Premium Telegram group</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-300">
                    <SparklesIcon className="w-4 h-4" />
                    <span>500 API requests/hour</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-purple-300">
                    <RocketLaunchIcon className="w-4 h-4" />
                    <span>500 Mbps guaranteed</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-300">
                    <RocketLaunchIcon className="w-4 h-4" />
                    <span>Every 6 hours + custom</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-300">
                    <RocketLaunchIcon className="w-4 h-4" />
                    <span>Private access to Dan</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-300">
                    <RocketLaunchIcon className="w-4 h-4" />
                    <span>2,000 API requests/hour</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Primary CTA Button */}
          <div className="space-y-4">
            <Button
              onClick={() => handleUpgrade(recommendedTier)}
              size="lg"
              className={`w-full font-bold text-lg py-4 ${
                recommendedTier === 'premium'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              }`}
            >
              {recommendedTier === 'premium' 
                ? 'Upgrade to Premium - $25/month'
                : 'Upgrade to Ultra - $125/month'
              }
            </Button>
            
            {/* Mobile-Optimized Contact Options */}
            {isMobile && (
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                <div className="text-center text-sm text-slate-400 mb-3">
                  📱 One-tap contact for mobile users
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {/* Email with copy button */}
                  <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                    <div>
                      <div className="text-white font-medium">Email</div>
                      <div className="text-sm text-slate-400">hello@bryanlabs.net</div>
                    </div>
                    <CopyButton 
                      value="hello@bryanlabs.net" 
                      label="email address"
                      className="text-blue-400 p-2"
                    />
                  </div>
                  
                  {/* Telegram with copy button */}
                  <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                    <div>
                      <div className="text-white font-medium">Telegram</div>
                      <div className="text-sm text-slate-400">@danbryan80</div>
                    </div>
                    <div className="flex gap-2">
                      <CopyButton 
                        value="@danbryan80" 
                        label="Telegram username"
                        className="text-blue-400 p-2"
                      />
                      <a
                        href="https://t.me/danbryan80"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="text-center text-xs text-slate-400 mt-3">
                  Mention "pricing page upgrade" for faster processing
                </div>
              </div>
            )}
            
            {/* Desktop Contact */}
            {!isMobile && (
              <div className="text-center text-slate-400">
                <p className="text-sm mb-2">Questions? Contact us anytime:</p>
                <div className="flex justify-center gap-4 text-sm">
                  <a href="mailto:hello@bryanlabs.net" className="text-blue-300 hover:text-blue-200">
                    hello@bryanlabs.net
                  </a>
                  <a href="https://t.me/danbryan80" className="text-blue-300 hover:text-blue-200" target="_blank" rel="noopener noreferrer">
                    @danbryan80
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Trust Indicators */}
        <div className="bg-slate-800/30 p-4 border-t border-slate-700">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="text-white font-semibold">100+</div>
              <div className="text-slate-400">Happy customers</div>
            </div>
            <div>
              <div className="text-white font-semibold">99.9%</div>
              <div className="text-slate-400">Uptime SLA</div>
            </div>
            <div>
              <div className="text-white font-semibold">24/7</div>
              <div className="text-slate-400">Global CDN</div>
            </div>
            <div>
              <div className="text-white font-semibold">Cancel</div>
              <div className="text-slate-400">Anytime</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
