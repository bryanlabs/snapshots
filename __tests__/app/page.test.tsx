import { render, screen } from '@testing-library/react';
import { auth } from '@/auth';
import HomePage from '../../app/page';

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/components/chains/ChainListServer', () => ({
  ChainListServer: () => <div data-testid="chain-list">Chain List Component</div>,
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the usable snapshot catalog for anonymous users', async () => {
    mockAuth.mockResolvedValue(null);

    render(await HomePage());

    expect(screen.getByText('Blockchain Snapshots')).toBeInTheDocument();
    expect(screen.getByText('Fast, reliable blockchain snapshots for Cosmos ecosystem chains')).toBeInTheDocument();
    expect(screen.getByText('Available Chains')).toBeInTheDocument();
    expect(screen.getByTestId('chain-list')).toBeInTheDocument();
  });

  it('links to API examples instead of pricing', async () => {
    mockAuth.mockResolvedValue(null);

    render(await HomePage());

    const apiLink = screen.getByRole('link', { name: 'API and CLI' });
    expect(apiLink).toHaveAttribute('href', '/api-docs');
    expect(screen.queryByText('View Pricing Plans')).not.toBeInTheDocument();
  });

  it('keeps DACS-IX as a network link', async () => {
    mockAuth.mockResolvedValue(null);

    render(await HomePage());

    const dacsLink = screen.getByText('Powered by DACS-IX');
    expect(dacsLink.closest('a')).toHaveAttribute('href', '/network');
  });

  it('renders without upgrade prompts for free users', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'user1',
        name: 'Free User',
        email: 'free@example.com',
        tier: 'free',
      },
    });

    render(await HomePage());

    expect(screen.queryByText(/upgrade/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('chain-list')).toBeInTheDocument();
  });
});
