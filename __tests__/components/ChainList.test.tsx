import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChainList } from '@/components/chains/ChainList';
import { useChains } from '@/hooks/useChains';
import { Chain } from '@/lib/types';

// Mock dependencies
jest.mock('@/hooks/useChains');
jest.mock('@/components/chains/ChainCard', () => ({
  ChainCard: ({ chain }: { chain: Chain }) => (
    <div data-testid={`chain-card-${chain.id}`} role="article" aria-label={`${chain.name} chain card`}>
      {chain.name}
    </div>
  ),
}));
jest.mock('@/components/common/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size: string }) => (
    <div data-testid="loading-spinner" aria-label="Loading chains" role="status">
      Loading {size}
    </div>
  ),
}));
jest.mock('@/components/common/ErrorMessage', () => ({
  ErrorMessage: ({ title, message, onRetry }: any) => (
    <div role="alert" aria-live="assertive">
      <h2>{title}</h2>
      <p>{message}</p>
      <button onClick={onRetry} aria-label="Try again">Try Again</button>
    </div>
  ),
}));

describe('ChainList', () => {
  let mockUseChains: jest.Mock;
  let mockChains: Chain[];
  let mockRefetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseChains = useChains as jest.Mock;
    mockRefetch = jest.fn();
    
    mockChains = [
      {
        id: 'cosmos-hub',
        name: 'Cosmos Hub',
        network: 'cosmoshub-4',
        description: 'The Cosmos Hub',
        logoUrl: '/cosmos.png',
      },
      {
        id: 'osmosis',
        name: 'Osmosis',
        network: 'osmosis-1',
        description: 'Osmosis DEX',
        logoUrl: '/osmosis.png',
      },
      {
        id: 'juno',
        name: 'Juno',
        network: 'juno-1',
        description: 'Juno Network',
        logoUrl: '/juno.png',
      },
      {
        id: 'akash',
        name: 'Akash Network',
        network: 'akashnet-2',
        description: 'Decentralized cloud',
        logoUrl: '/akash.png',
      },
      {
        id: 'secret',
        name: 'Secret Network',
        network: 'secret-4',
        description: 'Privacy blockchain',
        logoUrl: '/secret.png',
      },
    ];
    
    mockUseChains.mockReturnValue({
      chains: mockChains,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  it('should render chain list with all chains', () => {
    render(<ChainList />);
    
    expect(screen.getByTestId('chain-card-cosmos-hub')).toBeInTheDocument();
    expect(screen.getByTestId('chain-card-osmosis')).toBeInTheDocument();
    expect(screen.getByTestId('chain-card-juno')).toBeInTheDocument();
    expect(screen.getByTestId('chain-card-akash')).toBeInTheDocument();
    expect(screen.getByTestId('chain-card-secret')).toBeInTheDocument();
    expect(screen.getByText('Showing 5 of 5 chains')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseChains.mockReturnValue({
      chains: null,
      loading: true,
      error: null,
      refetch: mockRefetch,
    });
    
    render(<ChainList />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading chains');
    expect(spinner).toHaveAttribute('role', 'status');
    expect(screen.getByText('Loading lg')).toBeInTheDocument();
  });

  it('should show error state', () => {
    mockUseChains.mockReturnValue({
      chains: null,
      loading: false,
      error: 'Failed to fetch chains',
      refetch: mockRefetch,
    });
    
    render(<ChainList />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByText('Failed to load chains')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch chains')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('should handle retry on error', () => {
    mockUseChains.mockReturnValue({
      chains: null,
      loading: false,
      error: 'Failed to fetch chains',
      refetch: mockRefetch,
    });
    
    render(<ChainList />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);
    
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('should filter chains by search term', async () => {
    const user = userEvent.setup();
    
    render(<ChainList />);
    
    const searchInput = screen.getByPlaceholderText('Search chains...');
    await user.type(searchInput, 'cosmos');
    
    expect(screen.getByTestId('chain-card-cosmos-hub')).toBeInTheDocument();
    expect(screen.queryByTestId('chain-card-osmosis')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chain-card-juno')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chain-card-akash')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chain-card-secret')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 5 chains')).toBeInTheDocument();
  });

  it('should filter chains by network', () => {
    render(<ChainList />);
    
    const networkSelect = screen.getByRole('combobox');
    fireEvent.change(networkSelect, { target: { value: 'osmosis-1' } });
    
    expect(screen.queryByTestId('chain-card-cosmos-hub')).not.toBeInTheDocument();
    expect(screen.getByTestId('chain-card-osmosis')).toBeInTheDocument();
    expect(screen.queryByTestId('chain-card-juno')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 5 chains')).toBeInTheDocument();
  });

  it('should combine search and network filters', async () => {
    const user = userEvent.setup();
    
    render(<ChainList />);
    
    const searchInput = screen.getByPlaceholderText('Search chains...');
    const networkSelect = screen.getByRole('combobox');
    
    await user.type(searchInput, 'os');
    fireEvent.change(networkSelect, { target: { value: 'osmosis-1' } });
    
    expect(screen.queryByTestId('chain-card-cosmos-hub')).not.toBeInTheDocument();
    expect(screen.getByTestId('chain-card-osmosis')).toBeInTheDocument();
    expect(screen.queryByTestId('chain-card-juno')).not.toBeInTheDocument();
  });

  it('should show no results message', async () => {
    const user = userEvent.setup();
    
    render(<ChainList />);
    
    const searchInput = screen.getByPlaceholderText('Search chains...');
    await user.type(searchInput, 'nonexistent');
    
    expect(screen.getByText('No chains found matching your criteria')).toBeInTheDocument();
    expect(screen.getByText('Showing 0 of 5 chains')).toBeInTheDocument();
  });

  it('should populate network dropdown with unique networks', () => {
    render(<ChainList />);
    
    const networkSelect = screen.getByRole('combobox');
    const options = networkSelect.querySelectorAll('option');
    
    expect(options).toHaveLength(6); // All Networks + 5 unique networks
    expect(options[0]).toHaveTextContent('All Networks');
    expect(options[1]).toHaveTextContent('akashnet-2');
    expect(options[2]).toHaveTextContent('cosmoshub-4');
    expect(options[3]).toHaveTextContent('juno-1');
    expect(options[4]).toHaveTextContent('osmosis-1');
    expect(options[5]).toHaveTextContent('secret-4');
  });

  it('should be case-insensitive in search', async () => {
    const user = userEvent.setup();
    
    render(<ChainList />);
    
    const searchInput = screen.getByPlaceholderText('Search chains...');
    await user.type(searchInput, 'COSMOS');
    
    expect(screen.getByTestId('chain-card-cosmos-hub')).toBeInTheDocument();
  });

  it('should search by chain ID as well as name', async () => {
    const user = userEvent.setup();
    
    render(<ChainList />);
    
    const searchInput = screen.getByPlaceholderText('Search chains...');
    await user.type(searchInput, 'cosmos-hub');
    
    expect(screen.getByTestId('chain-card-cosmos-hub')).toBeInTheDocument();
    expect(screen.queryByTestId('chain-card-osmosis')).not.toBeInTheDocument();
  });

  it('should handle empty chains array', () => {
    mockUseChains.mockReturnValue({
      chains: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
    });
    
    render(<ChainList />);
    
    expect(screen.getByText('Showing 0 of 0 chains')).toBeInTheDocument();
    expect(screen.getByText('No chains found matching your criteria')).toBeInTheDocument();
  });

  it('should reset to all networks when selecting "All Networks"', () => {
    render(<ChainList />);
    
    const networkSelect = screen.getByRole('combobox');
    
    // First filter by a specific network
    fireEvent.change(networkSelect, { target: { value: 'osmosis-1' } });
    expect(screen.getByText('Showing 1 of 5 chains')).toBeInTheDocument();
    
    // Then reset to all networks
    fireEvent.change(networkSelect, { target: { value: 'all' } });
    expect(screen.getByText('Showing 5 of 5 chains')).toBeInTheDocument();
  });

  it('should handle null chains gracefully', () => {
    mockUseChains.mockReturnValue({
      chains: null,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });
    
    render(<ChainList />);
    
    expect(screen.getByText('Showing 0 of 0 chains')).toBeInTheDocument();
    expect(screen.getByText('No chains found matching your criteria')).toBeInTheDocument();
  });

  it('should clear search input', async () => {
    const user = userEvent.setup();
    
    render(<ChainList />);
    
    const searchInput = screen.getByPlaceholderText('Search chains...');
    
    // Type a search term
    await user.type(searchInput, 'cosmos');
    expect(screen.getByText('Showing 1 of 5 chains')).toBeInTheDocument();
    
    // Clear the search
    await user.clear(searchInput);
    expect(screen.getByText('Showing 5 of 5 chains')).toBeInTheDocument();
  });

  it('should filter by partial name match', async () => {
    const user = userEvent.setup();
    
    render(<ChainList />);
    
    const searchInput = screen.getByPlaceholderText('Search chains...');
    await user.type(searchInput, 'net');
    
    // Should match "Akash Network" and "Secret Network"
    expect(screen.queryByTestId('chain-card-cosmos-hub')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chain-card-osmosis')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chain-card-juno')).not.toBeInTheDocument();
    expect(screen.getByTestId('chain-card-akash')).toBeInTheDocument();
    expect(screen.getByTestId('chain-card-secret')).toBeInTheDocument();
    expect(screen.getByText('Showing 2 of 5 chains')).toBeInTheDocument();
  });

  it('should maintain filter state while typing', async () => {
    const user = userEvent.setup();
    
    render(<ChainList />);
    
    const searchInput = screen.getByPlaceholderText('Search chains...');
    
    // Type letter by letter
    await user.type(searchInput, 'j');
    expect(screen.getByTestId('chain-card-juno')).toBeInTheDocument();
    
    await user.type(searchInput, 'u');
    expect(screen.getByTestId('chain-card-juno')).toBeInTheDocument();
    
    await user.type(searchInput, 'n');
    expect(screen.getByTestId('chain-card-juno')).toBeInTheDocument();
    
    await user.type(searchInput, 'o');
    expect(screen.getByTestId('chain-card-juno')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 5 chains')).toBeInTheDocument();
  });

  it('should handle chains with duplicate networks correctly', () => {
    const chainsWithDuplicates = [
      ...mockChains,
      {
        id: 'cosmos-test',
        name: 'Cosmos Test',
        network: 'cosmoshub-4', // Duplicate network
        description: 'Test network',
        logoUrl: '/test.png',
      },
    ];
    
    mockUseChains.mockReturnValue({
      chains: chainsWithDuplicates,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });
    
    render(<ChainList />);
    
    const networkSelect = screen.getByRole('combobox');
    const options = networkSelect.querySelectorAll('option');
    
    // Should still have unique networks
    expect(options).toHaveLength(6); // All Networks + 5 unique networks (no duplicates)
  });

  it('should have correct accessibility attributes', () => {
    render(<ChainList />);
    
    const searchInput = screen.getByPlaceholderText('Search chains...');
    expect(searchInput).toHaveAttribute('type', 'text');
    
    const networkSelect = screen.getByRole('combobox');
    expect(networkSelect).toBeInTheDocument();
    
    // Check chain cards have proper roles
    const chainCards = screen.getAllByRole('article');
    expect(chainCards).toHaveLength(5);
    
    // Check aria-labels
    expect(screen.getByLabelText('Cosmos Hub chain card')).toBeInTheDocument();
  });

  it('should handle search with whitespace correctly', async () => {
    const user = userEvent.setup();
    
    render(<ChainList />);
    
    const searchInput = screen.getByPlaceholderText('Search chains...');
    await user.type(searchInput, '  cosmos  ');
    
    expect(screen.getByTestId('chain-card-cosmos-hub')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 5 chains')).toBeInTheDocument();
  });

  it('should render grid layout for chain cards', () => {
    render(<ChainList />);
    
    const gridContainer = screen.getByTestId('chain-card-cosmos-hub').parentElement;
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6');
  });

  it('should have correct styling for inputs', () => {
    render(<ChainList />);
    
    const searchInput = screen.getByPlaceholderText('Search chains...');
    expect(searchInput).toHaveClass('w-full', 'px-4', 'py-2', 'border', 'rounded-lg');
    expect(searchInput).toHaveClass('dark:bg-gray-700', 'dark:text-white');
    
    const networkSelect = screen.getByRole('combobox');
    expect(networkSelect).toHaveClass('border', 'rounded-lg');
    expect(networkSelect).toHaveClass('dark:bg-gray-700', 'dark:text-white');
  });
});