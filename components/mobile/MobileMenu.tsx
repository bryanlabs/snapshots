'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  HomeIcon, 
  ServerStackIcon, 
  UserIcon,
  ArrowDownTrayIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

export function MobileMenu() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const menuItems = [
    {
      href: '/',
      icon: HomeIcon,
      label: 'Home',
    },
    {
      href: '/chains',
      icon: ServerStackIcon,
      label: 'Chains',
    },
    {
      href: '/my-downloads',
      icon: ArrowDownTrayIcon,
      label: 'Downloads',
      requiresAuth: true,
    },
    {
      href: '/billing',
      icon: CreditCardIcon,
      label: 'Billing',
      requiresAuth: true,
    },
    {
      href: session ? '/account' : '/auth/signin',
      icon: UserIcon,
      label: session ? 'Account' : 'Sign In',
    },
  ];

  const visibleItems = menuItems.filter(
    item => !item.requiresAuth || session
  );

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-transform duration-300 md:hidden',
        !isVisible && 'translate-y-full'
      )}
    >
      <div className="grid grid-cols-5 h-16">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 text-xs transition-colors',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}