import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserAvatar } from '@/components/common/UserAvatar';

describe('UserAvatar', () => {
  it('should render initials when no image is provided', () => {
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    render(<UserAvatar user={user} />);
    
    const avatar = screen.getByText('JD');
    expect(avatar).toBeInTheDocument();
  });

  it('should render single initial for single name', () => {
    const user = {
      name: 'John',
      email: null,
    };

    render(<UserAvatar user={user} />);
    
    const avatar = screen.getByText('J');
    expect(avatar).toBeInTheDocument();
  });

  it('should use email for initials when no name is provided', () => {
    const user = {
      name: null,
      email: 'test@example.com',
    };

    render(<UserAvatar user={user} />);
    
    const avatar = screen.getByText('TE');
    expect(avatar).toBeInTheDocument();
  });

  it('should render "U" when no name or email is provided', () => {
    const user = {};

    render(<UserAvatar user={user} />);
    
    const avatar = screen.getByText('U');
    expect(avatar).toBeInTheDocument();
  });

  it('should render image when avatarUrl is provided', () => {
    const user = {
      name: 'John Doe',
      avatarUrl: '/avatars/test.jpg',
    };

    render(<UserAvatar user={user} />);
    
    const img = screen.getByAltText('John Doe');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/avatars/test.jpg');
  });

  it('should prefer avatarUrl over image', () => {
    const user = {
      name: 'John Doe',
      avatarUrl: '/avatars/custom.jpg',
      image: '/avatars/default.jpg',
    };

    render(<UserAvatar user={user} />);
    
    const img = screen.getByAltText('John Doe');
    expect(img).toHaveAttribute('src', '/avatars/custom.jpg');
  });

  it('should fall back to initials on image error', () => {
    const user = {
      name: 'John Doe',
      avatarUrl: '/avatars/broken.jpg',
    };

    render(<UserAvatar user={user} />);
    
    const img = screen.getByAltText('John Doe');
    fireEvent.error(img);
    
    // After error, should show initials
    const avatar = screen.getByText('JD');
    expect(avatar).toBeInTheDocument();
  });

  it('should apply correct size classes', () => {
    const user = { name: 'John Doe' };

    const { rerender } = render(<UserAvatar user={user} size="sm" />);
    let avatar = screen.getByText('JD');
    expect(avatar).toHaveClass('w-8', 'h-8', 'text-sm');

    rerender(<UserAvatar user={user} size="md" />);
    avatar = screen.getByText('JD');
    expect(avatar).toHaveClass('w-10', 'h-10', 'text-base');

    rerender(<UserAvatar user={user} size="lg" />);
    avatar = screen.getByText('JD');
    expect(avatar).toHaveClass('w-16', 'h-16', 'text-xl');
  });

  it('should apply custom className', () => {
    const user = { name: 'John Doe' };

    render(<UserAvatar user={user} className="custom-class" />);
    
    const avatar = screen.getByText('JD');
    expect(avatar).toHaveClass('custom-class');
  });

  it('should generate consistent background colors', () => {
    const user1 = { email: 'test@example.com' };
    const user2 = { email: 'test@example.com' };

    const { container: container1 } = render(<UserAvatar user={user1} />);
    const { container: container2 } = render(<UserAvatar user={user2} />);

    const avatar1 = container1.querySelector('[style*="background-color"]');
    const avatar2 = container2.querySelector('[style*="background-color"]');

    expect(avatar1?.getAttribute('style')).toBe(avatar2?.getAttribute('style'));
  });
});