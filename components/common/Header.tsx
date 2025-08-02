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
      
      <header className={`fixed left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b transition-all duration-300 ${
        isScrolled 
          ? 'border-border shadow-lg' 
          : 'border-transparent'
      } ${session?.user?.tier === 'free' ? 'top-12' : 'top-0'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 sm:space-x-4">
            <Image
              src="/bryanlabs-logo-transparent.png"
              alt="BryanLabs Logo"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
            <span className="text-2xl">
              <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Bryan</span>
              <span className="font-light text-foreground">Labs</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <ThemeToggle />
            {session ? (
              <UserDropdown user={session.user} />
            ) : !isAuthPage ? (
              <Link
                href="/auth/signin"
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Login
              </Link>
            ) : null}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-foreground hover:text-primary"
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
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              {session ? (
                <>
                  <span className="text-muted-foreground">
                    Welcome, {session.user?.name || session.user?.email}
                  </span>
                  <Link
                    href="/account"
                    className="text-foreground hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Account
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-foreground hover:text-primary transition-colors text-left"
                  >
                    Logout
                  </button>
                </>
              ) : !isAuthPage ? (
                <Link
                  href="/auth/signin"
                  className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors text-center"
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