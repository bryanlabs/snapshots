import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { signOut } from 'next-auth/react';
import { UserDropdown } from '@/components/common/UserDropdown';

// Mock dependencies
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

describe('UserDropdown', () => {
  const mockUser = {
    name: 'John Doe',
    email: 'john@example.com',
    tier: 'premium',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render user avatar button', () => {
    render(<UserDropdown user={mockUser} />);
    
    // Should render the avatar with initials
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('should show dropdown menu when clicked', () => {
    render(<UserDropdown user={mockUser} />);
    
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    // Check user info is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Premium Tier')).toBeInTheDocument();
  });

  it('should show all menu items when opened', () => {
    render(<UserDropdown user={mockUser} />);
    
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    // Check all menu items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Downloads')).toBeInTheDocument();
    expect(screen.getByText('Credits & Billing')).toBeInTheDocument();
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('should have correct links for menu items', () => {
    render(<UserDropdown user={mockUser} />);
    
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    expect(screen.getByRole('link', { name: /Dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /My Downloads/i })).toHaveAttribute('href', '/my-downloads');
    expect(screen.getByRole('link', { name: /Credits & Billing/i })).toHaveAttribute('href', '/billing');
    expect(screen.getByRole('link', { name: /Account Settings/i })).toHaveAttribute('href', '/account');
  });

  it('should handle sign out', async () => {
    mockSignOut.mockResolvedValue({ url: '/' });
    
    render(<UserDropdown user={mockUser} />);
    
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });

  it('should close dropdown when clicking outside', () => {
    render(
      <div>
        <UserDropdown user={mockUser} />
        <div data-testid="outside">Outside element</div>
      </div>
    );
    
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    // Menu should be open
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Click outside
    const outsideElement = screen.getByTestId('outside');
    fireEvent.mouseDown(outsideElement);
    
    // Menu should be closed
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('should close dropdown when clicking a link', () => {
    render(<UserDropdown user={mockUser} />);
    
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    // Menu should be open
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Click a link
    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    fireEvent.click(dashboardLink);
    
    // Menu should be closed
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('should show correct tier badge', () => {
    const { rerender } = render(<UserDropdown user={mockUser} />);
    
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    // Premium tier
    let tierBadge = screen.getByText('Premium Tier');
    expect(tierBadge).toHaveClass('bg-purple-100', 'text-purple-800');
    
    // Close and reopen with free tier
    fireEvent.click(avatarButton);
    rerender(<UserDropdown user={{ ...mockUser, tier: 'free' }} />);
    fireEvent.click(avatarButton);
    
    // Free tier
    tierBadge = screen.getByText('Free Tier');
    expect(tierBadge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('should display user avatar with image', () => {
    const userWithAvatar = {
      ...mockUser,
      avatarUrl: '/avatars/test.jpg',
    };
    
    render(<UserDropdown user={userWithAvatar} />);
    
    const avatar = screen.getByAltText('John Doe');
    expect(avatar).toHaveAttribute('src', '/avatars/test.jpg');
  });

  it('should animate chevron icon on toggle', () => {
    render(<UserDropdown user={mockUser} />);
    
    const avatarButton = screen.getByRole('button');
    const chevron = avatarButton.querySelector('svg');
    
    // Closed state
    expect(chevron).not.toHaveClass('rotate-180');
    
    // Open state
    fireEvent.click(avatarButton);
    expect(chevron).toHaveClass('rotate-180');
    
    // Closed state again
    fireEvent.click(avatarButton);
    expect(chevron).not.toHaveClass('rotate-180');
  });
});