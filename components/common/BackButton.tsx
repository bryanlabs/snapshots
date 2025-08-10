'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  /** Custom text to display (default: "All Snapshots") */
  text?: string;
  /** Custom href to navigate to (default: "/") */
  href?: string;
  /** Whether to show text on mobile (default: false - icon only on mobile) */
  showTextOnMobile?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function BackButton({ 
  text = "All Snapshots", 
  href = "/",
  showTextOnMobile = false,
  className 
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(href);
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="default"
      className={cn(
        // Base styles with purple/primary theme
        "bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800",
        "text-purple-700 dark:text-purple-300",
        "hover:bg-purple-50 dark:hover:bg-purple-950/50",
        "hover:border-purple-300 dark:hover:border-purple-700",
        "hover:text-purple-800 dark:hover:text-purple-200",
        "transition-all duration-200",
        "focus-visible:ring-purple-500 dark:focus-visible:ring-purple-400",
        "focus-visible:ring-offset-2",
        // Responsive padding for icon/text behavior
        showTextOnMobile ? "px-4" : "px-3 sm:px-4",
        className
      )}
      aria-label={showTextOnMobile ? undefined : `Navigate back to ${text}`}
    >
      <ArrowLeftIcon className="w-4 h-4" />
      <span className={cn(
        "ml-2 font-medium",
        showTextOnMobile ? "block" : "hidden sm:block"
      )}>
        {text}
      </span>
    </Button>
  );
}