import { Theme, BrandTheme, BRAND_THEMES } from '@pui/components';

export class ThemeService {
  static getStoredTheme(): Theme {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem('phi-theme') as Theme) || 'system';
  }

  static setStoredTheme(theme: Theme): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('phi-theme', theme);
  }

  static getBrand(id: string): BrandTheme {
    return BRAND_THEMES.find((b) => b.id === id) || BRAND_THEMES[0];
  }
}
