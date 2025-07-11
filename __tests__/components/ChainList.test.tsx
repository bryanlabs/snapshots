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
    <div data-testid={`chain-card-${chain.id}`}>{chain.name}</div>
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
    expect(screen.getByText('Showing 3 of 3 chains')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseChains.mockReturnValue({
      chains: null,
      loading: true,
      error: null,
      refetch: mockRefetch,
    });
    
    render(<ChainList />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should show error state', () => {
    mockUseChains.mockReturnValue({
      chains: null,
      loading: false,
      error: 'Failed to fetch chains',
      refetch: mockRefetch,
    });
    
    render(<ChainList />);
    
    expect(screen.getByText('Failed to load chains')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch chains')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should handle retry on error', () => {
    mockUseChains.mockReturnValue({
      chains: null,
      loading: false,
      error: 'Failed to fetch chains',
      refetch: mockRefetch,
    });
    
    render(<ChainList />);
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);
    
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should filter chains by search term', async () => {
    const user = userEvent.setup();
    
    render(<ChainList />);
    
    const searchInput = screen.getByPlaceholderText('Search chains...');
    await user.type(searchInput, 'cosmos');
    
    expect(screen.getByTestId('chain-card-cosmos-hub')).toBeInTheDocument();
    expect(screen.queryByTestId('chain-card-osmosis')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chain-card-juno')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 3 chains')).toBeInTheDocument();
  });

  it('should filter chains by network', () => {
    render(<ChainList />);
    
    const networkSelect = screen.getByRole('combobox');
    fireEvent.change(networkSelect, { target: { value: 'osmosis-1' } });
    
    expect(screen.queryByTestId('chain-card-cosmos-hub')).not.toBeInTheDocument();
    expect(screen.getByTestId('chain-card-osmosis')).toBeInTheDocument();
    expect(screen.queryByTestId('chain-card-juno')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 3 chains')).toBeInTheDocument();
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
    expect(screen.getByText('Showing 0 of 3 chains')).toBeInTheDocument();
  });

  it('should populate network dropdown with unique networks', () => {
    render(<ChainList />);
    
    const networkSelect = screen.getByRole('combobox');
    const options = networkSelect.querySelectorAll('option');
    
    expect(options).toHaveLength(4); // All Networks + 3 unique networks
    expect(options[0]).toHaveTextContent('All Networks');
    expect(options[1]).toHaveTextContent('cosmoshub-4');
    expect(options[2]).toHaveTextContent('juno-1');
    expect(options[3]).toHaveTextContent('osmosis-1');
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
    expect(screen.getByText('Showing 1 of 3 chains')).toBeInTheDocument();
    
    // Then reset to all networks
    fireEvent.change(networkSelect, { target: { value: 'all' } });
    expect(screen.getByText('Showing 3 of 3 chains')).toBeInTheDocument();
  });
});