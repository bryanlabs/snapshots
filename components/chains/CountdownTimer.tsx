'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownTimerProps {
  lastUpdated: Date | string;
  updateIntervalHours?: number;
}

interface TimeValues {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function CountdownTimer({ lastUpdated, updateIntervalHours = 6 }: CountdownTimerProps) {
  const [timeValues, setTimeValues] = useState<TimeValues>({ hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = (): TimeValues => {
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
        setIsPending(true);
        return { hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      setIsPending(false);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds, total: diff };
    };

    // Calculate immediately
    setTimeValues(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      setTimeValues(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated, updateIntervalHours]);

  // Check if we should show pulse (under 1 hour)
  const shouldPulse = timeValues.total > 0 && timeValues.total < 3600000; // 1 hour in milliseconds

  if (isPending) {
    return (
      <motion.span 
        className="font-semibold text-gray-600 dark:text-gray-400 text-base"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Update pending...
      </motion.span>
    );
  }

  return (
    <motion.span 
      className="font-semibold text-base inline-flex items-center gap-1 text-gray-900 dark:text-white"
      animate={shouldPulse ? { scale: [1, 1.05, 1] } : {}}
      transition={shouldPulse ? { duration: 2, repeat: Infinity } : {}}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={`hours-${timeValues.hours}`}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {timeValues.hours}h
        </motion.span>
      </AnimatePresence>
      {' '}
      <AnimatePresence mode="popLayout">
        <motion.span
          key={`minutes-${timeValues.minutes}`}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {timeValues.minutes}m
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}