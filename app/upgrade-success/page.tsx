"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function UpgradeSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tier, setTier] = useState<string>('');

  useEffect(() => {
    const tierParam = searchParams.get('tier');
    if (tierParam) {
      setTier(tierParam);
    }
  }, [searchParams]);

  const handleContinueToDashboard = () => {
    // Redirect with telegram invitation trigger
    const dashboardUrl = new URL('/account', window.location.origin);
    dashboardUrl.searchParams.set('telegram_invite', 'true');
    dashboardUrl.searchParams.set('upgrade_success', 'true');
    window.location.href = dashboardUrl.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircleIcon className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome to {tier.charAt(0).toUpperCase() + tier.slice(1)}!
          </CardTitle>
          <CardDescription className="text-slate-300 text-lg">
            Your account has been successfully upgraded
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Upgrade Benefits */}
          <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-6 border border-green-500/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              Your New Benefits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300">
              {tier === 'premium' && (
                <>
                  <div>✅ 250 Mbps download speeds</div>
                  <div>✅ Custom snapshot requests</div>
                  <div>✅ Priority queue access</div>
                  <div>✅ Premium Telegram group</div>
                  <div>✅ 500 API requests/hour</div>
                  <div>✅ Priority email support</div>
                </>
              )}
              {tier === 'ultra' && (
                <>
                  <div>✅ 500 Mbps download speeds</div>
                  <div>✅ Custom snapshot requests</div>
                  <div>✅ Highest priority queue</div>
                  <div>✅ Private group with Dan</div>
                  <div>✅ 2000 API requests/hour</div>
                  <div>✅ Phone support access</div>
                </>
              )}
            </div>
          </div>

          {/* Telegram Community CTA */}
          {(tier === 'premium' || tier === 'ultra') && (
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/30">
              <div className="flex items-start gap-4">
                <UserGroupIcon className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Join the {tier === 'ultra' ? 'Ultra VIP' : 'Premium'} Community
                  </h3>
                  <p className="text-slate-300 text-sm mb-4">
                    {tier === 'ultra' 
                      ? 'Get direct access to Dan and other Ultra users for personalized support and networking.'
                      : 'Connect with other premium users, get priority support, and access exclusive content.'
                    }
                  </p>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400">
                    💡 You'll be prompted to join your Telegram groups after clicking Continue
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Continue Button */}
          <div className="text-center pt-4">
            <Button 
              onClick={handleContinueToDashboard}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8"
            >
              Continue to Dashboard
            </Button>
            <p className="text-xs text-slate-400 mt-2">
              You'll be guided through setting up your community access
            </p>
          </div>

          {/* Alternative Actions */}
          <div className="flex justify-center gap-4 pt-4 border-t border-slate-700">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/chains')}
              className="text-slate-300 border-slate-600"
            >
              Browse Snapshots
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/account')}
              className="text-slate-300 border-slate-600"
            >
              Account Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}