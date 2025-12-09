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
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
      document.documentElement.setAttribute('data-theme', 'light');
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
      className={styles.themeToggle}
      data-theme={isDark ? 'dark' : 'light'}
    >
      <span className="sr-only">Toggle theme</span>
      <span className={`${styles.icon} ${styles.sun} ${!isDark ? styles.active : ''}`}>
        <ReactIcon icon="sun" />
      </span>
      <span className={`${styles.icon} ${styles.moon} ${isDark ? styles.active : ''}`}>
        <ReactIcon icon="moon-stars" />
      </span>
    </button>
  );
};

export default ThemeToggle;
