'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  lastUpdated: Date | string;
  updateIntervalHours?: number;
}

export function CountdownTimer({ lastUpdated, updateIntervalHours = 6 }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const lastUpdateTime = new Date(lastUpdated).getTime();
      const now = Date.now();
      const timeSinceUpdate = now - lastUpdateTime;
      const updateInterval = updateIntervalHours * 60 * 60 * 1000;
      
      // Calculate the next update time
      // If we've passed multiple intervals, calculate the next one
      const intervalsPassed = Math.floor(timeSinceUpdate / updateInterval);
      const nextUpdateTime = lastUpdateTime + ((intervalsPassed + 1) * updateInterval);
      const diff = nextUpdateTime - now;

      if (diff <= 0) {
        return 'Update pending...';
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return `${hours}h ${minutes}m ${seconds}s`;
    };

    // Calculate immediately
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated, updateIntervalHours]);

  return (
    <span className="font-medium text-gray-900 dark:text-white">
      {timeRemaining}
    </span>
  );
}