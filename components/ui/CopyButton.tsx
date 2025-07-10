"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CopyIcon } from "../icons";

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

interface CopyableValueProps {
  value: string;
  children: React.ReactNode;
  label?: string;
  className?: string;
}

// Simple Tooltip component
const Tooltip = ({
  children,
  content,
  isVisible,
}: {
  children: React.ReactNode;
  content: string;
  isVisible: boolean;
}) => {
  return (
    <div className="relative inline-block">
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2  px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none"
          >
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const CopyButton = ({
  value,
  label,
  className = "",
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleCopy}
      className={`p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors ${className}`}
      title={`Copy ${label || "value"}`}
    >
      {copied ? (
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-green-500 text-xs font-medium"
        >
          ✓
        </motion.span>
      ) : (
        <CopyIcon />
      )}
    </motion.button>
  );
};

export const CopyableValue = ({
  value,
  children,
  label,
  className = "",
}: CopyableValueProps) => {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setShowTooltip(true);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
        setShowTooltip(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleMouseEnter = () => {
    if (!copied) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    if (!copied) {
      setShowTooltip(false);
    }
  };

  const tooltipContent = copied
    ? "Copied!"
    : `Click to copy ${label || "value"}`;

  return (
    <Tooltip content={tooltipContent} isVisible={showTooltip}>
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={handleCopy}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`cursor-pointer transition-colors hover:text-accent-foreground ${className}`}
        >
          {children}
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors"
        >
          <CopyIcon />
        </motion.button>
      </div>
    </Tooltip>
  );
};
