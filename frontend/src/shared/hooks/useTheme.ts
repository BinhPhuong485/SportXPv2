import { create } from 'zustand';

export type AppThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: AppThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: AppThemeMode) => void;
}

const getInitialTheme = (): AppThemeMode => {
  try {
    const urlMatch = window.location.href.match(/[?&]theme=(light|dark)/);
    if (urlMatch && (urlMatch[1] === 'dark' || urlMatch[1] === 'light')) {
      return urlMatch[1] as AppThemeMode;
    }
    const saved = localStorage.getItem('sportxp-theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // fallback
  }
  return 'light'; // Default is light on first visit
};

const applyThemeToDOM = (theme: AppThemeMode) => {
  try {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sportxp-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#07080A' : '#176344');
    }
  } catch {
    // ignore
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  toggleTheme: () => {
    const nextTheme: AppThemeMode = get().theme === 'light' ? 'dark' : 'light';
    applyThemeToDOM(nextTheme);
    set({ theme: nextTheme });
  },
  setTheme: (theme: AppThemeMode) => {
    applyThemeToDOM(theme);
    set({ theme });
  },
}));
