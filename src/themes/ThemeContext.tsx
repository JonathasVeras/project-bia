import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeName, themes } from './themes';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'bia-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as ThemeName) || 'win95';
  });

  const setTheme = (name: ThemeName) => {
    setThemeState(name);
    localStorage.setItem(STORAGE_KEY, name);
  };

  useEffect(() => {
    const t = themes[theme];
    const root = document.documentElement;
    for (const [key, value] of Object.entries(t.vars)) {
      root.style.setProperty(key, value);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
