'use client';

import { useTheme, type Theme } from './ThemeProvider';

const THEMES: { value: Theme; label: string }[] = [
  { value: 'dark',  label: 'DARK'  },
  { value: 'light', label: 'LIGHT' },
  { value: 'navy',  label: 'NAVY'  },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="qt-theme-pick">
      {THEMES.map((t) => (
        <button
          key={t.value}
          className={theme === t.value ? 'active' : ''}
          onClick={() => setTheme(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
