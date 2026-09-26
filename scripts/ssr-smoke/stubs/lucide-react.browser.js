/**
 * A small inline icon set standing in for lucide-react.
 *
 * The sandbox that builds this bundle has no npm registry, so the real package
 * cannot be installed here. These are the lucide glyphs the apps actually use,
 * hand-transcribed as paths on lucide's own 24x24 grid with its stroke
 * conventions, so the published build renders real icons rather than empty
 * boxes. Any name not listed still resolves — to a neutral dot — so a new icon
 * never crashes the page.
 */
const React = require('react');

const P = {
  Activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  AlertCircle: 'M12 2a10 10 0 100 20 10 10 0 000-20M12 8v4M12 16h.01',
  AlertTriangle: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0M12 9v4M12 17h.01',
  ArrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  ArrowRight: 'M5 12h14M12 5l7 7-7 7',
  MoreHorizontal: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  Settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  Bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  Bookmark: 'm19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
  BadgeCheck: 'M12 2l2.4 2.4H18v3.6L20.4 12 18 14.4V18h-3.6L12 20.4 9.6 18H6v-3.6L3.6 12 6 9.6V6h3.6zM9 12l2 2 4-4',
  Compass: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z',
  Home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z',
  MessageCircle: 'M7.9 20A9 9 0 1 0 4 16.1L2 22z',
  Music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  Share2: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6M8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  UserCheck: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M16 11l2 2 4-4',
  Volume2: 'M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14',
  VolumeX: 'M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6',
  BookOpen: 'M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
  Boxes: 'M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-4.5-2.6a2 2 0 0 0-2.06 0zM7 16.5 3.1 14.75M12 13.5V19l4.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0zM8.5 8.5 12 10.5l3.5-2M12 2.5 8.5 4.5v4L12 10.5l3.5-2v-4z',
  Check: 'M20 6 9 17l-5-5',
  CheckCircle2: 'M12 2a10 10 0 100 20 10 10 0 000-20M9 12l2 2 4-4',
  ChevronDown: 'm6 9 6 6 6-6',
  ChevronLeft: 'm15 18-6-6 6-6',
  ChevronRight: 'm9 18 6-6-6-6',
  ChevronUp: 'm18 15-6-6-6 6',
  Code2: 'm18 16 4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16',
  Copy: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2M9 8h10c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2',
  Cpu: 'M4 4h16v16H4zM9 9h6v6H9zM9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2',
  CreditCard: 'M2 5h20v14H2zM2 10h20',
  Database: 'M12 3c4.97 0 9 1.34 9 3s-4.03 3-9 3-9-1.34-9-3 4.03-3 9-3M3 6v12c0 1.66 4.03 3 9 3s9-1.34 9-3V6M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3',
  File: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  FileCode: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M10 13l-2 2 2 2M14 13l2 2-2 2',
  FlaskConical: 'M10 2v7.5L4.6 18A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.7-3L14 9.5V2M8.5 2h7M7 15h10',
  Folder: 'M4 4h5l2 3h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1',
  GraduationCap: 'M22 10 12 5 2 10l10 5zM6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5',
  Heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z',
  History: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l4 2',
  Info: 'M12 2a10 10 0 100 20 10 10 0 000-20M12 16v-4M12 8h.01',
  Layers: 'm12 2 9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5',
  Loader2: 'M21 12a9 9 0 1 1-6.22-8.56',
  MapPin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  Menu: 'M4 6h16M4 12h16M4 18h16',
  MessageSquare: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  Minus: 'M5 12h14',
  Moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9',
  Package: 'm7.5 4.27 9 5.15M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8M3.3 7 12 12l8.7-5M12 22V12',
  Palette: 'M12 2a10 10 0 1 0 0 20 2 2 0 0 0 1.6-3.2 2 2 0 0 1 1.6-3.2h1.9A4.9 4.9 0 0 0 22 10.7C21.6 5.8 17.3 2 12 2M7.5 10.5h.01M10.5 7.5h.01M14.5 7.5h.01M17.5 10.5h.01',
  PanelLeft: 'M3 3h18v18H3zM9 3v18',
  PanelLeftClose: 'M3 3h18v18H3zM9 3v18M16 15l-3-3 3-3',
  PanelLeftOpen: 'M3 3h18v18H3zM9 3v18M14 9l3 3-3 3',
  PanelRight: 'M3 3h18v18H3zM15 3v18',
  Play: 'm6 3 14 9-14 9z',
  Plus: 'M5 12h14M12 5v14',
  Radio: 'M4.9 19.1a10 10 0 0 1 0-14.2M7.8 16.2a6 6 0 0 1 0-8.4M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2M16.2 7.8a6 6 0 0 1 0 8.4M19.1 4.9a10 10 0 0 1 0 14.2',
  Redo2: 'm15 14 5-5-5-5M20 9H9.5A5.5 5.5 0 1 0 9.5 20H13',
  RefreshCw: 'M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M3 21v-5h5',
  RotateCcw: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  Search: 'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16M21 21l-4.3-4.3',
  Send: 'm22 2-7 20-4-9-9-4zM22 2 11 13',
  Shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10',
  ShoppingBag: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
  ShoppingCart: 'M8 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2M19 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2M2 3h2.2l2.6 12.6a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6',
  SlidersHorizontal: 'M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4',
  Sparkles: 'm12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M21 5h-4M5 17v4M7 19H3',
  Square: 'M4 4h16v16H4z',
  Star: 'm12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
  Sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  Terminal: 'm4 17 6-6-6-6M12 19h8',
  Trash2: 'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6',
  Undo2: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 1 1 0 11H11',
  User: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
  X: 'M18 6 6 18M6 6l12 12',
  Zap: 'M13 2 3 14h9l-1 8 10-12h-9z',
};

const cache = {};

const make = (name) => {
  const d = P[name];
  const Icon = ({ size = 24, strokeWidth = 2, className, color, fill, ...rest } = {}) =>
    React.createElement(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: fill && fill !== 'none' ? 'currentColor' : 'none',
        stroke: 'currentColor',
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className,
        'aria-hidden': 'true',
        focusable: 'false',
        style: { flex: '0 0 auto', display: 'block' },
        ...rest,
      },
      d
        ? React.createElement('path', { d })
        : React.createElement('circle', { cx: 12, cy: 12, r: 3 })
    );
  Icon.displayName = name;
  return Icon;
};

const proxy = new Proxy(
  {},
  {
    get: (t, p) => {
      if (p === '__esModule') return true;
      if (p === 'default') return proxy;
      if (typeof p !== 'string') return undefined;
      if (!cache[p]) cache[p] = make(p);
      return cache[p];
    },
  }
);

module.exports = proxy;
