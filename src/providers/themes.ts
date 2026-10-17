import { BrandColors, BrandTheme } from './types';

const B = (o: Partial<BrandColors>): BrandColors => ({
  primary: '#3b82f6', primaryHover: '#2563eb', primaryLight: '#eff6ff', primaryLightDark: '#1e3a8a',
  secondary: '#475569', secondaryHover: '#334155',
  success: '#10b981', successLight: '#ecfdf5', successLightDark: '#064e3b',
  warning: '#f59e0b', warningLight: '#fffbeb', warningLightDark: '#78350f',
  error: '#ef4444', errorHover: '#dc2626', errorLight: '#fef2f2', errorLightDark: '#450a0a',
  info: '#0ea5e9', infoHover: '#0284c7', infoLight: '#f0f9ff', infoLightDark: '#0c4a6e',
  ...o,
});

export const BRAND_THEMES: BrandTheme[] = [
  { id: 'phi', name: 'Phi Core', colors: B({ primary: '#6366f1', primaryHover: '#4f46e5', secondary: '#06b6d4' }), gradient: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)', gradientDark: 'linear-gradient(135deg, #6366f1 0%, #164e63 100%)' },
  { id: 'phiace', name: 'PhiAce', colors: B({ primary: '#0ea5e9', primaryHover: '#0284c7', secondary: '#6366f1' }), gradient: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', gradientDark: 'linear-gradient(135deg, #0ea5e9 0%, #312e81 100%)' },
  { id: 'phiano', name: 'Phiano Phase', colors: B({ primary: '#8b5cf6', primaryHover: '#7c3aed', secondary: '#ec4899' }), gradient: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', gradientDark: 'linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)' },
  { id: 'phidoc', name: 'PhiDoc', colors: B({ primary: '#14b8a6', primaryHover: '#0d9488', secondary: '#0f766e' }), gradient: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)', gradientDark: 'linear-gradient(135deg, #14b8a6 0%, #134e4a 100%)' },
  { id: 'phient', name: 'Phient', colors: B({ primary: '#d946ef', primaryHover: '#c026d3', secondary: '#8b5cf6' }), gradient: 'linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%)', gradientDark: 'linear-gradient(135deg, #d946ef 0%, #581c87 100%)' },
  { id: 'phinet', name: 'Phinet Spectrum', colors: B({ primary: '#f97316', primaryHover: '#ea580c', primaryLight: 'rgba(249, 115, 22, 0.12)', primaryLightDark: 'rgba(251, 146, 60, 0.2)', secondary: '#0891b2', secondaryHover: '#0e7490', info: '#06b6d4' }), gradient: 'linear-gradient(135deg, #f97316 0%, #06b6d4 100%)', gradientDark: 'linear-gradient(135deg, #f97316 0%, #164e63 100%)' },
  { id: 'phixum', name: 'Phixum Options', colors: B({ primary: '#0284c7', primaryHover: '#0369a1', secondary: '#0f172a' }), gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', gradientDark: 'linear-gradient(135deg, #0284c7 0%, #082f49 100%)' },
  { id: 'edx', name: 'edX Paragon', colors: B({ primary: '#00262b', primaryHover: '#00525d', secondary: '#c40026' }), gradient: 'linear-gradient(135deg, #00262b 0%, #007382 100%)', gradientDark: 'linear-gradient(135deg, #00262b 0%, #001518 100%)' },
  { id: 'foundry', name: 'Palantir Foundry', colors: B({ primary: '#3b82f6', primaryHover: '#2563eb' }), gradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', gradientDark: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)' },
  { id: 'blueprint', name: 'Blueprint Slate', colors: B({ primary: '#2d72d2', primaryHover: '#1f53a3', secondary: '#5c7080' }), gradient: 'linear-gradient(135deg, #2d72d2 0%, #106ba3 100%)', gradientDark: 'linear-gradient(135deg, #2d72d2 0%, #182026 100%)' },
  { id: 'emerald', name: 'Emerald Foundry', colors: B({ primary: '#10b981', primaryHover: '#059669' }), gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', gradientDark: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)' },
  { id: 'midnight', name: 'Midnight Indigo', colors: B({ primary: '#4f46e5', primaryHover: '#4338ca' }), gradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', gradientDark: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)' },
  { id: 'amber', name: 'Amber Gold', colors: B({ primary: '#d97706', primaryHover: '#b45309' }), gradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)', gradientDark: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)' },
  { id: 'sapphire', name: 'Sapphire Deep', colors: B({ primary: '#2563eb', primaryHover: '#1d4ed8' }), gradient: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', gradientDark: 'linear-gradient(135deg, #2563eb 0%, #172554 100%)' },
  { id: 'crimson', name: 'Scarlet Crimson', colors: B({ primary: '#e11d48', primaryHover: '#be123c' }), gradient: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)', gradientDark: 'linear-gradient(135deg, #e11d48 0%, #881337 100%)' },
  { id: 'amethyst', name: 'Amethyst Mystic', colors: B({ primary: '#9333ea', primaryHover: '#7e22ce' }), gradient: 'linear-gradient(135deg, #9333ea 0%, #a855f7 100%)', gradientDark: 'linear-gradient(135deg, #9333ea 0%, #581c87 100%)' },
  { id: 'chanel', name: 'Chanel Noir', colors: B({ primary: '#0a0a0a', primaryHover: '#262626', primaryDark: '#f5f5f5', primaryHoverDark: '#e5e5e5', primaryLight: '#f5f5f5', primaryLightDark: '#171717', secondary: '#8a7960', secondaryHover: '#6f6149' }), gradient: 'linear-gradient(135deg, #0a0a0a 0%, #8a7960 100%)', gradientDark: 'linear-gradient(135deg, #f5f5f5 0%, #8a7960 100%)' },
  { id: 'phlick', name: 'Phlick Pulse', colors: B({ primary: '#fe2c55', primaryHover: '#e11d48', secondary: '#25f4ee', secondaryHover: '#06b6d4' }), gradient: 'linear-gradient(135deg, #fe2c55 0%, #25f4ee 100%)', gradientDark: 'linear-gradient(135deg, #fe2c55 0%, #0f172a 100%)', controlGradient: 'linear-gradient(90deg, #fe2c55 0%, #1d4ed8 100%)', controlGradientHover: 'linear-gradient(270deg, #fe2c55 0%, #1d4ed8 100%)' },
  { id: 'obsidian', name: 'Obsidian Pure', colors: B({ primary: '#52525b', primaryHover: '#3f3f46', secondary: '#18181b' }), gradient: 'linear-gradient(135deg, #52525b 0%, #71717a 100%)', gradientDark: 'linear-gradient(135deg, #27272a 0%, #09090b 100%)' },
  { id: 'coral', name: 'Sunset Coral', colors: B({ primary: '#f97316', primaryHover: '#ea580c' }), gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)', gradientDark: 'linear-gradient(135deg, #f97316 0%, #7c2d12 100%)' },
  { id: 'titanium', name: 'Titanium Platinum', colors: B({ primary: '#64748b', primaryHover: '#475569' }), gradient: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)', gradientDark: 'linear-gradient(135deg, #64748b 0%, #1e293b 100%)' },
  { id: 'aurora', name: 'Aurora Borealis', colors: B({ primary: '#14b8a6', primaryHover: '#0d9488' }), gradient: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)', gradientDark: 'linear-gradient(135deg, #14b8a6 0%, #134e4a 100%)' },
  { id: 'zenith', name: 'Solar Zenith', colors: B({ primary: '#eab308', primaryHover: '#ca8a04' }), gradient: 'linear-gradient(135deg, #eab308 0%, #facc15 100%)', gradientDark: 'linear-gradient(135deg, #eab308 0%, #713f12 100%)' },
  { id: 'uaia', name: 'UAIA Signal', colors: B({ primary: '#22d3ee', primaryHover: '#06b6d4', secondary: '#818cf8', secondaryHover: '#6366f1' }), gradient: 'linear-gradient(135deg, #22d3ee 0%, #818cf8 100%)', gradientDark: 'linear-gradient(135deg, #22d3ee 0%, #0b1533 100%)', controlGradient: 'linear-gradient(90deg, #06b6d4 0%, #6366f1 100%)', controlGradientHover: 'linear-gradient(270deg, #06b6d4 0%, #6366f1 100%)' },
  { id: 'phiegg', name: 'Phiegg Organic', colors: B({ primary: '#c67139', primaryHover: '#b2622d', primaryDark: '#f6a06b', primaryHoverDark: '#ffc6a5', primaryLight: '#ffe1d0', primaryLightDark: '#402310', secondary: '#7a8a5e', secondaryHover: '#56633f', success: '#728157', successLight: '#e1eecc', successLightDark: '#272e1b', warning: '#d67f48', warningLight: '#fff2eb', warningLightDark: '#643312', info: '#7a8a5e', infoHover: '#56633f', infoLight: '#f0fae1', infoLightDark: '#3d472b' }), gradient: 'linear-gradient(135deg, #c67139 0%, #7a8a5e 100%)', gradientDark: 'linear-gradient(135deg, #f6a06b 0%, #3d472b 100%)' },
  { id: 'apple', name: 'Apple', colors: B({ primary: '#0071e3', primaryHover: '#0077ed', primaryDark: '#2997ff', primaryHoverDark: '#47a6ff', primaryLight: '#e8f2fd', primaryLightDark: '#0a2540', secondary: '#86868b', secondaryHover: '#6e6e73', success: '#34c759', successLight: '#eafaf0', successLightDark: '#0f3d1f', warning: '#ff9f0a', warningLight: '#fff5e6', warningLightDark: '#4a2e00', error: '#ff3b30', errorHover: '#e0352b', errorLight: '#ffeceb', errorLightDark: '#4a1210', info: '#0a84ff', infoHover: '#0071e3', infoLight: '#e8f2fd', infoLightDark: '#0a2540' }), gradient: 'linear-gradient(135deg, #0071e3 0%, #5e5ce6 100%)', gradientDark: 'linear-gradient(135deg, #2997ff 0%, #1c1c1e 100%)' },
  { id: 'spacex', name: 'SpaceX', colors: B({ primary: '#000000', primaryHover: '#232324', primaryDark: '#ffffff', primaryHoverDark: '#e4e4e4', primaryLight: '#f2f2f2', primaryLightDark: '#1a1a1b', secondary: '#a7a9ac', secondaryHover: '#85878a', success: '#2ea043', successLight: '#e9f6ec', successLightDark: '#0d2b15', warning: '#d29922', warningLight: '#fbf3e1', warningLightDark: '#3a2a07', error: '#e5484d', errorHover: '#cc3f44', errorLight: '#fdecec', errorLightDark: '#3d1214', info: '#005288', infoHover: '#003f69', infoLight: '#e6f0f6', infoLightDark: '#06263d' }), gradient: 'linear-gradient(135deg, #000000 0%, #005288 100%)', gradientDark: 'linear-gradient(135deg, #ffffff 0%, #005288 100%)' },
];

export const THEME_STYLES = [
  { id: 'apple', name: 'Apple' },
  { id: 'flat', name: 'Flat' },
  { id: 'gradient', name: 'Gradient' },
  { id: 'elevated', name: 'Elevated' },
  { id: 'glass', name: 'Glass' },
  { id: 'organic', name: 'Organic' },
  { id: 'spacex', name: 'SpaceX' },
];
