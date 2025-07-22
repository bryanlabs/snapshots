'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { UpgradePrompt } from './UpgradePrompt';
import { ThemeToggle } from './ThemeToggle';
import { UserDropdown } from './UserDropdown';
import { useSession, signOut } from 'next-auth/react';

export function Header() {
  const sessionData = useSession();
  const session = sessionData?.data;
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Hide login button on auth pages
  const isAuthPage = pathname?.startsWith('/auth/');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Upgrade banner for free users */}
      {session?.user?.tier === 'free' && <UpgradePrompt variant="banner" className="fixed top-0 left-0 right-0 z-50" />}
      
      <header className={`fixed left-0 right-0 z-40 backdrop-blur-md border-b transition-all duration-300 ${
        isScrolled 
          ? 'bg-gray-900/95 border-gray-700/50 shadow-lg' 
          : 'bg-gray-900/80 border-transparent'
      } ${session?.user?.tier === 'free' ? 'top-12' : 'top-0'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/bryanlabs_banner.png"
              alt="BryanLabs"
              width={150}
              height={60}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <ThemeToggle />
            {session ? (
              <UserDropdown user={session.user} />
            ) : !isAuthPage ? (
              <Link
                href="/auth/signin"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Login
              </Link>
            ) : null}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-300 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700/50">
            <nav className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Theme</span>
                <ThemeToggle />
              </div>
              {session ? (
                <>
                  <span className="text-gray-400">
                    Welcome, {session.user?.name || session.user?.email}
                  </span>
                  <Link
                    href="/account"
                    className="text-gray-300 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Account
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-gray-300 hover:text-white transition-colors text-left"
                  >
                    Logout
                  </button>
                </>
              ) : !isAuthPage ? (
                <Link
                  href="/auth/signin"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              ) : null}
            </nav>
          </div>
        )}
      </div>
    </header>
    </>
  );
}