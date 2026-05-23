import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';
import { cn } from '../../lib/utils';

export type AppTheme = 'dark' | 'light';

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = 'barber_theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveInitialTheme(): AppTheme {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(resolveInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme: setThemeState,
    toggleTheme: () => setThemeState((current) => current === 'dark' ? 'light' : 'dark'),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn('theme-toggle-shell inline-flex items-center gap-1 rounded-full p-1', className)} role="group" aria-label="בחירת ערכת נושא">
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
        className={cn('theme-toggle-option', theme === 'dark' && 'is-active')}
      >
        <MoonStar size={15} />
        כהה
      </button>
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
        className={cn('theme-toggle-option', theme === 'light' && 'is-active')}
      >
        <SunMedium size={15} />
        בהיר
      </button>
    </div>
  );
}
