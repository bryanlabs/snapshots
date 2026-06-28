'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
    } catch {
      // localStorage may be unavailable; theme still applies for this session.
    }
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };

  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted text-foreground transition-colors hover:bg-primary hover:text-white"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}