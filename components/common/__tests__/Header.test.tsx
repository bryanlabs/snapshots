import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Header } from '../Header';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock components
jest.mock('../UpgradePrompt', () => ({
  UpgradePrompt: ({ variant, className }: { variant?: string; className?: string }) => (
    <div data-testid="upgrade-prompt" data-variant={variant} className={className}>
      Upgrade Prompt
    </div>
  ),
}));

jest.mock('../ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

jest.mock('../UserDropdown', () => ({
  UserDropdown: ({ user }: { user: any }) => (
    <div data-testid="user-dropdown">{user.name || user.email}</div>
  ),
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
    
    // Mock scroll behavior
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
    });
  });

  describe('upgrade banner display', () => {
    it('should show upgrade banner for free tier users', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user1',
            name: 'Free User',
            email: 'free@example.com',
            tier: 'free',
          },
        },
        status: 'authenticated',
      });

      render(<Header />);

      const upgradeBanner = screen.getByTestId('upgrade-prompt');
      expect(upgradeBanner).toBeInTheDocument();
      expect(upgradeBanner).toHaveAttribute('data-variant', 'banner');
      expect(upgradeBanner).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50');
    });

    it('should NOT show upgrade banner for premium users', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user2',
            name: 'Premium User',
            email: 'premium@example.com',
            tier: 'premium',
          },
        },
        status: 'authenticated',
      });

      render(<Header />);

      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
    });

    it('should NOT show upgrade banner for unlimited users', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user3',
            name: 'Ultimate User',
            email: 'ultimate@example.com',
            tier: 'unlimited',
          },
        },
        status: 'authenticated',
      });

      render(<Header />);

      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
    });

    it('should NOT show upgrade banner for enterprise users', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user4',
            name: 'Enterprise User',
            email: 'enterprise@example.com',
            tier: 'enterprise',
          },
        },
        status: 'authenticated',
      });

      render(<Header />);

      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
    });

    it('should NOT show upgrade banner for users with null tier', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user5',
            name: 'No Tier User',
            email: 'notier@example.com',
            tier: null,
          },
        },
        status: 'authenticated',
      });

      render(<Header />);

      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
    });

    it('should NOT show upgrade banner for unauthenticated users', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      render(<Header />);

      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
    });
  });

  describe('header positioning', () => {
    it('should position header with top-12 offset for free users (to accommodate banner)', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user1',
            name: 'Free User',
            tier: 'free',
          },
        },
        status: 'authenticated',
      });

      const { container } = render(<Header />);
      const header = container.querySelector('header');

      expect(header).toHaveClass('top-12');
    });

    it('should position header with top-0 for premium users (no banner)', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user2',
            name: 'Premium User',
            tier: 'premium',
          },
        },
        status: 'authenticated',
      });

      const { container } = render(<Header />);
      const header = container.querySelector('header');

      expect(header).toHaveClass('top-0');
    });

    it('should position header with top-0 for unlimited users (no banner)', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user3',
            name: 'Ultimate User',
            tier: 'unlimited',
          },
        },
        status: 'authenticated',
      });

      const { container } = render(<Header />);
      const header = container.querySelector('header');

      expect(header).toHaveClass('top-0');
    });
  });

  describe('user authentication states', () => {
    it('should show user dropdown for authenticated users', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user1',
            name: 'Test User',
            email: 'test@example.com',
            tier: 'premium',
          },
        },
        status: 'authenticated',
      });

      render(<Header />);

      expect(screen.getByTestId('user-dropdown')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should show login button for unauthenticated users on non-auth pages', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      mockUsePathname.mockReturnValue('/');

      render(<Header />);

      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/auth/signin');
    });

    it('should NOT show login button on auth pages', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      mockUsePathname.mockReturnValue('/auth/signin');

      render(<Header />);

      expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
    });
  });

  describe('logo and branding', () => {
    it('should display BryanLabs logo and text', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      render(<Header />);

      expect(screen.getByAltText('BryanLabs Logo')).toBeInTheDocument();
      expect(screen.getByText('Bryan')).toBeInTheDocument();
      expect(screen.getByText('Labs')).toBeInTheDocument();
    });

    it('should link logo to homepage', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      render(<Header />);

      const logoLink = screen.getByRole('link', { name: /bryanlabs logo/i });
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });

  describe('theme toggle', () => {
    it('should always show theme toggle', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      render(<Header />);

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });
  });
});