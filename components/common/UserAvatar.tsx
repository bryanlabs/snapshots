'use client';

import { useState } from 'react';

interface UserAvatarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    avatarUrl?: string | null;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl',
  };
  
  // Get initials from name or email
  const getInitials = () => {
    const name = user.name || user.email || 'U';
    const parts = name.split(/[\s@]+/);
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };
  
  // Generate a consistent color based on the user's identifier
  const getBackgroundColor = () => {
    const str = user.email || user.name || 'user';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 60%, 45%)`;
  };
  
  const imageUrl = user.avatarUrl || user.image;
  
  if (imageUrl && !imageError) {
    return (
      <img
        src={imageUrl}
        alt={user.name || 'User'}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }
  
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium text-white ${className}`}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      {getInitials()}
    </div>
  );
}