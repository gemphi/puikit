import React, { useState, useEffect, useRef } from 'react';
import { BRAND_THEMES } from '../../../providers/themes';
import { BrandTheme } from '../../../providers/types';
import { cn } from '../../../utils/cn';
import { ChevronDown, Palette } from 'lucide-react';
import { Box } from '../../layout/Box';
import styles from './styles.module.scss';

export interface BrandSelectorProps {
  value?: string;
  onChange?: (brand: BrandTheme) => void;
  className?: string;
  storageKey?: string;
}

export const BrandSelector: React.FC<BrandSelectorProps> = ({
  value,
  onChange,
  className,
  storageKey = 'pui-brand-theme',
}) => {
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (value) return value;
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey) || 'edx';
    }
    return 'edx';
  });

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTheme = BRAND_THEMES.find((t) => t.id === selectedId) || BRAND_THEMES[0];

  useEffect(() => {
    if (value && value !== selectedId) {
      setSelectedId(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (theme: BrandTheme) => {
    setSelectedId(theme.id);
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, theme.id);
      window.dispatchEvent(new CustomEvent('pui-brand-changed', { detail: theme }));
    }
    onChange?.(theme);
  };

  return (
    <Box ref={containerRef} className={cn(styles.brandSelector, className)}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className={styles.colorDot}
          style={{ background: activeTheme.colors.primary }}
        />
        <span>{activeTheme.name}</span>
        <ChevronDown size={14} style={{ opacity: 0.6, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>

      {isOpen && (
        <Box className={styles.dropdown} role="listbox">
          {BRAND_THEMES.map((theme) => {
            const isCurrent = theme.id === selectedId;
            return (
              <button
                key={theme.id}
                type="button"
                role="option"
                aria-selected={isCurrent}
                className={cn(styles.item, isCurrent && styles.active)}
                onClick={() => handleSelect(theme)}
              >
                <span
                  className={styles.colorDot}
                  style={{ background: theme.colors.primary }}
                />
                <span className={styles.label}>{theme.name}</span>
              </button>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

BrandSelector.displayName = 'BrandSelector';
