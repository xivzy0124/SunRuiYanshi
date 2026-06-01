import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'theme';

export default function useTheme() {
  const [theme, setTheme] = useState(() => {
    // 从 localStorage 读取，默认夜间
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

  // 应用主题到 DOM
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // 切换主题
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme, isDark: theme === 'dark' };
}
