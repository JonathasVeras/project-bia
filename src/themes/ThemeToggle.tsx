import { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { themes } from './themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTheme = themes[theme];

  return (
    <div className="theme-dropdown" ref={dropdownRef}>
      <button
        className="theme-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="theme-dropdown-label">{currentTheme.label}</span>
        <span className="theme-dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="theme-dropdown-menu">
          {Object.values(themes).map((t) => (
            <button
              key={t.name}
              className={`theme-dropdown-item ${t.name === theme ? 'active' : ''}`}
              onClick={() => {
                setTheme(t.name);
                setIsOpen(false);
              }}
            >
              <span 
                className="theme-dropdown-color" 
                style={{ background: t.vars['--titlebar-gradient'] }}
              />
              <span className="theme-dropdown-text">{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
