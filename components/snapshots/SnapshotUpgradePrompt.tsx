import Link from 'next/link';
import { cn } from '@/lib/utils';
import { components, typography } from '@/lib/design-system';
import { getSnapshotAccessSummary, getNextSnapshotTime } from '@/lib/utils/tier';

interface SnapshotUpgradePromptProps {
  minimumTier: string;
  userTier?: string;
  chainName: string;
  generationCycle?: 'daily' | 'twice-daily' | 'six-hourly';
  className?: string;
}

export function SnapshotUpgradePrompt({ 
  minimumTier, 
  userTier = 'free',
  chainName,
  generationCycle,
  className 
}: SnapshotUpgradePromptProps) {
  const getUpgradeMessage = () => {
    if (minimumTier === 'ultra') {
      const ultraAccess = getSnapshotAccessSummary('ultra');
      return {
        title: 'Ultra Tier Required',
        description: `Get fresh ${chainName} snapshots every 6 hours with Ultra tier`,
        benefits: [
          '6-hour fresh snapshots (4x daily)',
          'Fastest sync times available',
          '500 Mbps download speeds',
          'Priority support'
        ],
        cta: 'Upgrade to Ultra',
        href: '/pricing#ultra'
      };
    }
    
    if (minimumTier === 'premium') {
      const premiumAccess = getSnapshotAccessSummary('premium');
      return {
        title: 'Premium Tier Required',
        description: `Access twice-daily ${chainName} snapshots with Premium tier`,
        benefits: [
          'Twice-daily snapshots (12-hour fresh)',
          'Faster sync than daily snapshots', 
          '250 Mbps download speeds',
          'No ads, priority support'
        ],
        cta: 'Upgrade to Premium',
        href: '/pricing#premium'
      };
    }
    
    return null;
  };

  const upgradeInfo = getUpgradeMessage();
  if (!upgradeInfo) return null;

  const nextAvailableSnapshot = getNextSnapshotTime(userTier);
  const timeUntilNext = Math.ceil((nextAvailableSnapshot.getTime() - Date.now()) / (1000 * 60 * 60));

  return (
    <div className={cn(
      components.card.base,
      'p-4 border-dashed border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50',
      className
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
            <h4 className={cn(typography.h6, 'text-amber-700 dark:text-amber-300')}>
              {upgradeInfo.title}
            </h4>
          </div>
          
          <p className={cn(typography.body.small, typography.muted, 'mb-3')}>
            {upgradeInfo.description}
          </p>
          
          <div className="space-y-1 mb-4">
            {upgradeInfo.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="w-1 h-1 bg-blue-500 rounded-full flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>

          {timeUntilNext > 0 && (
            <p className={cn(typography.body.small, 'text-gray-500 dark:text-gray-400 mb-3')}>
              Your next snapshot: in {timeUntilNext} hour{timeUntilNext !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <Link
            href={upgradeInfo.href}
            className={cn(
              'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
              'bg-blue-600 text-white hover:bg-blue-700',
              'dark:bg-blue-500 dark:hover:bg-blue-600'
            )}
          >
            {upgradeInfo.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}