"use client";

import { motion } from "framer-motion";

interface StatusIndicatorProps {
  isLive: boolean;
  isLoading?: boolean;
  className?: string;
}

export const StatusIndicator = ({
  isLive,
  isLoading = false,
  className = "",
}: StatusIndicatorProps) => {
  if (isLoading) {
    return (
      <motion.div
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
        }}
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 ${className}`}
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-2 h-2 bg-orange-500 rounded-full"
        />
        Loading Data...
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
        isLive ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
      } ${className}`}
    >
      <motion.div
        animate={
          isLive
            ? {
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              }
            : {}
        }
        transition={
          isLive
            ? {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : {}
        }
        className={`w-2 h-2 rounded-full ${
          isLive ? "bg-green-500" : "bg-yellow-500"
        }`}
      />
      {isLive ? (
        <span>Live Data • Polkachu API</span>
      ) : (
        <span>Cached Data • API Unavailable</span>
      )}
    </motion.div>
  );
};
