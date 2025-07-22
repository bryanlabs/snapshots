import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSession, signOut } from 'next-auth/react';
import { Header } from '@/components/common/Header';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is not logged in', () => {
    it('should show login button on desktop', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      render(<Header />);

      const loginButton = screen.getByRole('link', { name: 'Login' });
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveAttribute('href', '/auth/signin');
    });

    it('should show login button in mobile menu', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      render(<Header />);

      // Open mobile menu
      const menuButton = screen.getByRole('button', { name: '' }); // Mobile menu button
      fireEvent.click(menuButton);

      const loginButton = screen.getAllByRole('link', { name: 'Login' })[1]; // Second one is in mobile menu
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveAttribute('href', '/auth/signin');
    });

    it('should not show user dropdown', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      render(<Header />);

      expect(screen.queryByText('Welcome,')).not.toBeInTheDocument();
    });
  });

  describe('when user is logged in', () => {
    const mockSession = {
      user: {
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        tier: 'premium',
      },
      expires: new Date().toISOString(),
    };

    it('should not show login button on desktop', () => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      } as any);

      render(<Header />);

      expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument();
    });

    it('should show user dropdown on desktop', () => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      } as any);

      render(<Header />);

      // UserDropdown should be rendered (it contains the user avatar)
      const userDropdown = document.querySelector('[class*="UserAvatar"]');
      expect(userDropdown).toBeTruthy();
    });

    it('should show user info and logout in mobile menu', () => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      } as any);

      render(<Header />);

      // Open mobile menu
      const menuButton = screen.getByRole('button', { name: '' });
      fireEvent.click(menuButton);

      expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Account' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument();
    });

    it('should handle logout from mobile menu', () => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      } as any);

      render(<Header />);

      // Open mobile menu
      const menuButton = screen.getByRole('button', { name: '' });
      fireEvent.click(menuButton);

      const logoutButton = screen.getByRole('button', { name: 'Logout' });
      fireEvent.click(logoutButton);

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should show upgrade banner for free tier users', () => {
      mockUseSession.mockReturnValue({
        data: {
          ...mockSession,
          user: { ...mockSession.user, tier: 'free' },
        },
        status: 'authenticated',
      } as any);

      render(<Header />);

      // UpgradePrompt component should be rendered
      const upgradePrompt = document.querySelector('[class*="UpgradePrompt"]');
      expect(upgradePrompt).toBeTruthy();
    });

    it('should not show upgrade banner for premium users', () => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      } as any);

      render(<Header />);

      // UpgradePrompt component should not be rendered
      const upgradePrompt = document.querySelector('[class*="UpgradePrompt"]');
      expect(upgradePrompt).toBeFalsy();
    });
  });

  describe('mobile menu behavior', () => {
    it('should toggle mobile menu', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      render(<Header />);

      const menuButton = screen.getByRole('button', { name: '' });
      
      // Menu should be closed initially
      expect(screen.queryByText('Theme')).not.toBeInTheDocument();

      // Open menu
      fireEvent.click(menuButton);
      expect(screen.getByText('Theme')).toBeInTheDocument();

      // Close menu
      fireEvent.click(menuButton);
      expect(screen.queryByText('Theme')).not.toBeInTheDocument();
    });
  });
});