'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
  disabled?: boolean;
}

export function Tooltip({
  children,
  content,
  position = 'top',
  delay = 500,
  className,
  disabled = false
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if it's a touch device
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const showTooltip = () => {
    if (disabled || isTouchDevice) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  const getAnimationVariants = () => {
    const baseVariants = {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 }
    };

    switch (position) {
      case 'top':
        return {
          ...baseVariants,
          initial: { ...baseVariants.initial, y: 5 },
          animate: { ...baseVariants.animate, y: 0 },
          exit: { ...baseVariants.exit, y: 5 }
        };
      case 'bottom':
        return {
          ...baseVariants,
          initial: { ...baseVariants.initial, y: -5 },
          animate: { ...baseVariants.animate, y: 0 },
          exit: { ...baseVariants.exit, y: -5 }
        };
      case 'left':
        return {
          ...baseVariants,
          initial: { ...baseVariants.initial, x: 5 },
          animate: { ...baseVariants.animate, x: 0 },
          exit: { ...baseVariants.exit, x: 5 }
        };
      case 'right':
        return {
          ...baseVariants,
          initial: { ...baseVariants.initial, x: -5 },
          animate: { ...baseVariants.animate, x: 0 },
          exit: { ...baseVariants.exit, x: -5 }
        };
      default:
        return baseVariants;
    }
  };

  if (disabled || isTouchDevice) {
    return <>{children}</>;
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            className={cn(
              'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-800 rounded-md shadow-lg pointer-events-none whitespace-nowrap',
              getPositionClasses(),
              className
            )}
            variants={getAnimationVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="tooltip"
            aria-hidden={!isVisible}
          >
            {content}
            {/* Arrow */}
            <div 
              className={cn(
                'absolute w-0 h-0 border-4 border-transparent',
                position === 'top' && 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-800',
                position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-800',
                position === 'left' && 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-800',
                position === 'right' && 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-800'
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}