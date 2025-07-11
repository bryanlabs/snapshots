'use client';

import Link from 'next/link';
import { useAuth } from '../providers/AuthProvider';
import { useState } from 'react';
import { UpgradePrompt } from './UpgradePrompt';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Upgrade banner for free users */}
      {!user && <UpgradePrompt variant="banner" className="fixed top-0 left-0 right-0 z-50" />}
      
      <header className={`fixed left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 ${!user ? 'top-12' : 'top-0'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-white">BryanLabs</span>
            <span className="text-sm text-gray-400">Snapshots</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Chains
            </Link>
            <ThemeToggle />
            {user ? (
              <>
                <span className="text-gray-400">
                  Welcome, {user.name || user.email}
                </span>
                <button
                  onClick={() => logout()}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Login
              </Link>
            )}
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
          <div className="md:hidden py-4 border-t border-gray-800">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/"
                className="text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Chains
              </Link>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Theme</span>
                <ThemeToggle />
              </div>
              {user ? (
                <>
                  <span className="text-gray-400">
                    Welcome, {user.name || user.email}
                  </span>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="text-gray-300 hover:text-white transition-colors text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
    </>
  );
}