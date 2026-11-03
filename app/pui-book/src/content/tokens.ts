export interface TokenSpec {
  name: string;
  variable: string;
  value: string;
  description: string;
}

export const CORE_TOKENS: TokenSpec[] = [
  { name: 'Primary Color', variable: '--phi-color-primary', value: '#3b82f6', description: 'Core interactive action color' },
  { name: 'Success Intent', variable: '--phi-color-success', value: '#10b981', description: 'Harmonic resonance and positive status' },
  { name: 'Warning Intent', variable: '--phi-color-warning', value: '#f59e0b', description: 'Phase tension and advisory notice' },
  { name: 'Error Intent', variable: '--phi-color-error', value: '#ef4444', description: 'Destructive interference and error state' },
  { name: 'Background', variable: '--phi-color-background', value: '#0f172a / #ffffff', description: 'Dynamic root surface' },
  { name: 'Card Surface', variable: '--phi-color-background-card', value: '#1e293b / #ffffff', description: 'Elevated container surface' },
  { name: 'Border', variable: '--phi-color-border', value: '#334155 / #e2e8f0', description: 'Subtle component boundary' },
];

export const ELEVATION_TOKENS: TokenSpec[] = [
  { name: 'Elevation 0', variable: '--phi-shadow-0', value: 'none', description: 'Flat border-only layout' },
  { name: 'Elevation 1', variable: '--phi-shadow-1', value: '0 1px 3px rgba(0,0,0,0.1)', description: 'Default card elevation' },
  { name: 'Elevation 2', variable: '--phi-shadow-2', value: '0 4px 6px rgba(0,0,0,0.1)', description: 'Interactive card hover elevation' },
  { name: 'Elevation 3', variable: '--phi-shadow-3', value: '0 10px 15px rgba(0,0,0,0.1)', description: 'Popovers, menus, and dropdowns' },
  { name: 'Elevation 4', variable: '--phi-shadow-4', value: '0 20px 25px rgba(0,0,0,0.1)', description: 'Modal dialogs and drawer overlays' },
];
