'use client';

import { useState, useMemo } from 'react';
import { Chain } from '@/lib/types';
import { ChainCard } from './ChainCard';

interface ChainListClientProps {
  initialChains: Chain[];
}

export function ChainListClient({ initialChains }: ChainListClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');

  const networks = useMemo(() => {
    const uniqueNetworks = [...new Set(initialChains.map(chain => chain.network))];
    return uniqueNetworks.sort();
  }, [initialChains]);

  const filteredChains = useMemo(() => {
    return initialChains.filter(chain => {
      const matchesSearch = searchTerm === '' || 
        chain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chain.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesNetwork = selectedNetwork === 'all' || chain.network === selectedNetwork;
      
      return matchesSearch && matchesNetwork;
    });
  }, [initialChains, searchTerm, selectedNetwork]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search chains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <select
          value={selectedNetwork}
          onChange={(e) => setSelectedNetwork(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Networks</option>
          {networks.map(network => (
            <option key={network} value={network}>
              {network}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredChains.length} of {initialChains.length} chains
      </div>

      {/* Chain Grid */}
      {filteredChains.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No chains found matching your criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChains.map(chain => (
            <ChainCard key={chain.id} chain={chain} />
          ))}
        </div>
      )}
    </div>
  );
}