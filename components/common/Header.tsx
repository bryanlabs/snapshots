'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { UserDropdown } from './UserDropdown';
import { useSession, signOut } from 'next-auth/react';
import { Database, Server, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Chains', href: '/chains', icon: Server, match: ['/', '/chains'] },
  { label: 'API', href: '/api-docs#api-explorer', icon: Database, match: ['/api-docs'] },
];

function isActive(pathname: string | null, match: string[]) {
  if (!pathname) return false;
  return match.some((m) => (m === '/' ? pathname === '/' : pathname.startsWith(m)));
}

export function Header() {
  const sessionData = useSession();
  const session = sessionData?.data;
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Hide login button on auth pages
  const isAuthPage = pathname?.startsWith('/auth/');

  return (
    <header className="fixed left-0 right-0 top-10 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Desktop navigation (left aligned) */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.match);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ' +
                  (active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground')
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex md:items-center md:gap-2">
            <ThemeToggle />
            {session ? (
              <UserDropdown user={session.user} />
            ) : !isAuthPage ? (
              <Link
                href="/auth/signin"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Login
              </Link>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-foreground hover:text-primary md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="border-t border-border px-4 py-4 md:hidden">
          <nav className="flex flex-col space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="flex items-center justify-between pt-2">
              <span className="text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            {session ? (
              <>
                <Link
                  href="/account"
                  className="text-foreground transition-colors hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Account
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                  className="text-left text-foreground transition-colors hover:text-primary"
                >
                  Logout
                </button>
              </>
            ) : !isAuthPage ? (
              <Link
                href="/auth/signin"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
