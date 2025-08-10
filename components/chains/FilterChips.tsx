'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface FilterChipsProps {
  filters: string[];
  onRemove: (filter: string) => void;
}

export function FilterChips({ filters, onRemove }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <AnimatePresence>
        {filters.map((filter) => (
          <motion.div
            key={filter}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm"
          >
            <span>{filter}</span>
            <button
              onClick={() => onRemove(filter)}
              className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
              aria-label={`Remove ${filter} filter`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}