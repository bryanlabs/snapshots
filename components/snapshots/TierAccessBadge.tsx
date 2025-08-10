import { cn } from '@/lib/utils';
import { components } from '@/lib/design-system';
import { 
  getSnapshotAccessSummary, 
  hasUltraFeatures, 
  hasPremiumFeatures 
} from '@/lib/utils/tier';

interface TierAccessBadgeProps {
  minimumTier?: string;
  userTier?: string;
  isAccessible?: boolean;
  generationCycle?: 'daily' | 'twice-daily' | 'six-hourly';
  hourGenerated?: number;
  className?: string;
}

export function TierAccessBadge({ 
  minimumTier, 
  userTier, 
  isAccessible = true,
  generationCycle,
  hourGenerated,
  className 
}: TierAccessBadgeProps) {
  if (!minimumTier || minimumTier === 'free') {
    return (
      <span className={cn(
        components.badge.base,
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        className
      )}>
        public
      </span>
    );
  }

  const getBadgeStyle = () => {
    if (isAccessible) {
      if (minimumTier === 'ultra') {
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      }
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    } else {
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 opacity-60';
    }
  };

  const getBadgeText = () => {
    if (generationCycle) {
      const cycleMap = {
        'six-hourly': '6h Fresh',
        'twice-daily': '12h Fresh', 
        'daily': 'Daily'
      };
      
      if (isAccessible) {
        return cycleMap[generationCycle];
      } else {
        return `${minimumTier.charAt(0).toUpperCase() + minimumTier.slice(1)} Only`;
      }
    }
    
    if (minimumTier === 'ultra') {
      return isAccessible ? 'ultra' : 'ultra only';
    }
    
    return isAccessible ? 'premium' : 'premium only';
  };

  return (
    <span className={cn(
      components.badge.base,
      getBadgeStyle(),
      className
    )}>
      {getBadgeText()}
    </span>
  );
}

interface SnapshotFreshnessIndicatorProps {
  hourGenerated?: number;
  userTier?: string;
  isAccessible?: boolean;
  className?: string;
}

export function SnapshotFreshnessIndicator({ 
  hourGenerated, 
  userTier, 
  isAccessible = true,
  className 
}: SnapshotFreshnessIndicatorProps) {
  if (hourGenerated === undefined) return null;

  const now = new Date();
  const currentHour = now.getUTCHours();
  const hoursOld = currentHour >= hourGenerated 
    ? currentHour - hourGenerated 
    : 24 - hourGenerated + currentHour;

  const getFreshnessColor = () => {
    if (!isAccessible) {
      return 'text-gray-400 dark:text-gray-500';
    }
    
    if (hoursOld <= 6) return 'text-green-600 dark:text-green-400';
    if (hoursOld <= 12) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getFreshnessText = () => {
    if (hoursOld === 0) return 'Just created';
    if (hoursOld === 1) return '1 hour old';
    return `${hoursOld} hours old`;
  };

  return (
    <span className={cn(
      'text-xs font-medium',
      getFreshnessColor(),
      className
    )}>
      {getFreshnessText()}
    </span>
  );
}