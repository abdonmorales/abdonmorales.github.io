import { useEffect, useState } from 'react';
import ReactIcon from './ReactIcon';
import styles from './ThemeToggle.module.css';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);
  const storageKey = 'theme';

  useEffect(() => {
    // Initialize from localStorage or system preference
    const savedTheme = localStorage.getItem(storageKey);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    setIsDark(initialTheme === 'dark');
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(storageKey)) {
        const newIsDark = e.matches;
        setIsDark(newIsDark);
        updateDocumentTheme(newIsDark);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const updateDocumentTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('theme-dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
    }
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    const newTheme = newIsDark ? 'dark' : 'light';
    localStorage.setItem(storageKey, newTheme);
    updateDocumentTheme(newIsDark);
  };

  return (
    <button 
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className={`${styles.themeToggleButton} ${isDark ? styles.dark : ''}`}
    >
      <span className="sr-only">Dark theme</span>
      <span className={`${styles.icon} ${styles.light}`}>
        <ReactIcon icon="sun" />
      </span>
      <span className={`${styles.icon} ${styles.dark}`}>
        <ReactIcon icon="moon-stars" />
      </span>
    </button>
  );
};

export default ThemeToggle;
