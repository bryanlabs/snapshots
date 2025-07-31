'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chain } from '@/lib/types';
import { ChainCard } from './ChainCard';
import { FilterChips } from './FilterChips';
import { ChainCardSkeletonGrid } from './ChainCardSkeleton';
import { KeyboardShortcutsModal } from '@/components/common/KeyboardShortcutsModal';
import { useChainsQuery } from '@/hooks/useChainsQuery';
import { RefreshCw } from 'lucide-react';

interface ChainListRealtimeProps {
  initialChains: Chain[];
  pollInterval?: number;
}

type SortOption = 'name' | 'lastUpdated' | 'size';

export function ChainListRealtime({ initialChains, pollInterval = 60000 }: ChainListRealtimeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [recentlyUpdated, setRecentlyUpdated] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('name');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use React Query for real-time updates
  const { data: chains = initialChains, isRefetching, refetch } = useChainsQuery({
    initialData: initialChains,
    refetchInterval: pollInterval,
  });

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          // Allow ESC to clear search when focused on search input
          if (target === searchInputRef.current && searchTerm) {
            e.preventDefault();
            setSearchTerm('');
            searchInputRef.current?.blur();
          }
        }
        return;
      }

      switch (e.key) {
        case '/':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            searchInputRef.current?.focus();
          }
          break;
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            // Refresh data via React Query
            refetch();
          }
          break;
        case '?':
          if (!e.ctrlKey && !e.metaKey && !e.altKey && e.shiftKey) {
            e.preventDefault();
            setShowShortcutsModal(true);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm, refetch]);

  const filteredAndSortedChains = useMemo(() => {
    let filteredChains = chains.filter(chain => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        chain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chain.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Recently updated filter (last 24 hours)
      let matchesRecent = true;
      if (recentlyUpdated) {
        if (!chain.latestSnapshot) {
          matchesRecent = false;
        } else {
          const lastModified = new Date(chain.latestSnapshot.lastModified);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          matchesRecent = lastModified > oneDayAgo;
        }
      }
      
      return matchesSearch && matchesRecent;
    });

    // Sort chains
    filteredChains.sort((a, b) => {
      switch (sortOption) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'lastUpdated':
          const aTime = a.latestSnapshot?.lastModified ? new Date(a.latestSnapshot.lastModified).getTime() : 0;
          const bTime = b.latestSnapshot?.lastModified ? new Date(b.latestSnapshot.lastModified).getTime() : 0;
          return bTime - aTime; // Most recent first
        case 'size':
          const aSize = a.latestSnapshot?.size || 0;
          const bSize = b.latestSnapshot?.size || 0;
          return bSize - aSize; // Largest first
        default:
          return 0;
      }
    });

    return filteredChains;
  }, [chains, searchTerm, recentlyUpdated, sortOption]);

  // Get search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    return chains
      .filter(chain => 
        chain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chain.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 5)
      .map(chain => ({
        id: chain.id,
        name: chain.name,
        network: chain.network
      }));
  }, [searchTerm, chains]);

  const activeFilters = useMemo(() => {
    const filters: string[] = [];
    if (recentlyUpdated) filters.push('Recently Updated');
    if (sortOption !== 'name') {
      const sortLabels = {
        lastUpdated: 'Last Updated',
        size: 'Size'
      };
      filters.push(`Sort: ${sortLabels[sortOption]}`);
    }
    return filters;
  }, [recentlyUpdated, sortOption]);

  const removeFilter = (filter: string) => {
    if (filter === 'Recently Updated') {
      setRecentlyUpdated(false);
    } else if (filter.startsWith('Sort:')) {
      setSortOption('name');
    }
  };

  return (
    <div>
      {/* Enhanced Search Section */}
      <div className="mb-8 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search chains..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full px-12 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
            />
            {/* Search Icon */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {/* Keyboard hint or Clear button */}
            {!searchTerm ? (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-gray-400 pointer-events-none">
                <span className="text-sm hidden sm:inline">Press</span>
                <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono">/</kbd>
                <span className="text-sm hidden sm:inline">to search</span>
              </div>
            ) : (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Search Suggestions */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
              {searchSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => {
                    setSearchTerm(suggestion.name);
                    setShowSuggestions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {suggestion.name.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => 
                        part.toLowerCase() === searchTerm.toLowerCase() ? (
                          <span key={i} className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                            {part}
                          </span>
                        ) : (
                          <span key={i}>{part}</span>
                        )
                      )}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{suggestion.network}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {/* Recently Updated Toggle */}
            <button
              onClick={() => setRecentlyUpdated(!recentlyUpdated)}
              className={`px-3 sm:px-4 py-2 rounded-lg border transition-all duration-200 text-sm sm:text-base ${
                recentlyUpdated 
                  ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600' 
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-500'
              }`}
            >
              <span className="hidden sm:inline">Recently Updated</span>
              <span className="sm:hidden">Recent</span>
            </button>

            {/* Sort Options */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            >
              <option value="name">Sort by Name</option>
              <option value="lastUpdated">Sort by Last Updated</option>
              <option value="size">Sort by Size</option>
            </select>
          </div>

          {/* Refresh Indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              title="Refresh chains"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </button>
            {isRefetching && <span>Updating...</span>}
            <span className="text-xs hidden sm:inline">Auto-refresh every 60s</span>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <FilterChips filters={activeFilters} onRemove={removeFilter} />
        )}
      </div>

      {/* Results count and keyboard hints */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between">
        <span>
          Showing {filteredAndSortedChains.length} of {chains.length} chains
        </span>
        <div className="hidden sm:flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">/</kbd>
            Search
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">R</kbd>
            Refresh
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">?</kbd>
            Help
          </span>
        </div>
      </div>

      {/* Chain Grid */}
      {filteredAndSortedChains.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No chains found matching your criteria
          </p>
          {activeFilters.length > 0 && (
            <button
              onClick={() => {
                setSearchTerm('');
                setRecentlyUpdated(false);
                setSortOption('name');
              }}
              className="mt-4 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredAndSortedChains.map((chain, index) => (
              <motion.div
                key={chain.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ChainCard chain={chain} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal 
        isOpen={showShortcutsModal} 
        onClose={() => setShowShortcutsModal(false)} 
      />
    </div>
  );
}