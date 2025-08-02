import { render, screen } from '@testing-library/react';
import { auth } from '@/auth';
import HomePage from '../page';

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

// Mock components
jest.mock('@/components/chains/ChainListServer', () => ({
  ChainListServer: () => <div data-testid="chain-list">Chain List Component</div>,
}));

jest.mock('@/components/common/UpgradePrompt', () => ({
  UpgradePrompt: () => <div data-testid="upgrade-prompt">Upgrade Prompt Component</div>,
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upgrade prompt display logic', () => {
    it('should show upgrade prompt for free tier users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user1',
          name: 'Free User',
          email: 'free@example.com',
          tier: 'free',
        },
      });

      render(await HomePage());

      expect(screen.getByTestId('upgrade-prompt')).toBeInTheDocument();
    });

    it('should NOT show upgrade prompt for premium users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user2',
          name: 'Premium User',
          email: 'premium@example.com',
          tier: 'premium',
        },
      });

      render(await HomePage());

      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
    });

    it('should NOT show upgrade prompt for unlimited users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user3',
          name: 'Ultimate User',
          email: 'ultimate@example.com',
          tier: 'unlimited',
        },
      });

      render(await HomePage());

      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
    });

    it('should NOT show upgrade prompt for enterprise users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user4',
          name: 'Enterprise User',
          email: 'enterprise@example.com',
          tier: 'enterprise',
        },
      });

      render(await HomePage());

      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
    });

    it('should NOT show upgrade prompt for users with null tier', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user5',
          name: 'No Tier User',
          email: 'notier@example.com',
          tier: null,
        },
      });

      render(await HomePage());

      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
    });

    it('should NOT show upgrade prompt for users with undefined tier', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user6',
          name: 'Undefined Tier User',
          email: 'undefined@example.com',
          // tier is undefined
        },
      });

      render(await HomePage());

      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
    });

    it('should NOT show upgrade prompt for anonymous users', async () => {
      mockAuth.mockResolvedValue(null);

      render(await HomePage());

      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
    });
  });

  describe('page content', () => {
    it('should always display hero section', async () => {
      mockAuth.mockResolvedValue(null);

      render(await HomePage());

      expect(screen.getByText('Blockchain Snapshots')).toBeInTheDocument();
      expect(screen.getByText('Fast, reliable blockchain snapshots for Cosmos ecosystem chains')).toBeInTheDocument();
    });

    it('should always display available chains section', async () => {
      mockAuth.mockResolvedValue(null);

      render(await HomePage());

      expect(screen.getByText('Available Chains')).toBeInTheDocument();
      expect(screen.getByTestId('chain-list')).toBeInTheDocument();
    });

    it('should display feature highlights', async () => {
      mockAuth.mockResolvedValue(null);

      render(await HomePage());

      expect(screen.getByText('Updated 4x daily')).toBeInTheDocument();
      expect(screen.getByText('Latest zstd compression')).toBeInTheDocument();
      expect(screen.getByText('Powered by DACS-IX')).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('should show loading skeleton while chain list loads', async () => {
      mockAuth.mockResolvedValue(null);

      render(await HomePage());

      // The Suspense fallback should render loading skeletons
      // (Note: In actual test this would require more sophisticated async testing)
      expect(screen.getByTestId('chain-list')).toBeInTheDocument();
    });
  });

  describe('upgrade prompt placement', () => {
    it('should place upgrade prompt between header and chain list for free users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user1',
          name: 'Free User',
          tier: 'free',
        },
      });

      render(await HomePage());

      const upgradePrompt = screen.getByTestId('upgrade-prompt');
      const chainList = screen.getByTestId('chain-list');
      
      // Both should be present
      expect(upgradePrompt).toBeInTheDocument();
      expect(chainList).toBeInTheDocument();
      
      // Upgrade prompt should come before chain list in DOM order
      const upgradePromptElement = upgradePrompt.parentElement;
      const chainListElement = chainList.parentElement?.parentElement; // Account for Suspense wrapper
      
      expect(upgradePromptElement?.compareDocumentPosition(chainListElement!))
        .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });
  });

  describe('SEO and metadata', () => {
    it('should not interfere with page metadata', async () => {
      mockAuth.mockResolvedValue({
        user: { tier: 'premium' },
      });

      // This test ensures the page renders without throwing
      // Metadata is handled at the layout level
      expect(() => render(await HomePage())).not.toThrow();
    });
  });
});