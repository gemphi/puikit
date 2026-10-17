import React from 'react';
import { MessageCircle, Users, Database, Layers, Boxes, Vote, Wallet, Package, Terminal, LayoutGrid, House, ChartLine, Map, Circle, ShoppingBag, Rocket, Compass, Cpu, Link2, Network, FileText, CheckCircle2, Coins, UserRound, MapPin, CreditCard, ClipboardCheck, type LucideIcon } from 'lucide-react';
import type { IconPath } from './data';

const MAP: Record<string, LucideIcon> = { chat: MessageCircle, users: Users, db: Database, layers: Layers, cube: Boxes, vote: Vote, wallet: Wallet, box: Package, terminal: Terminal, grid: LayoutGrid, home: House, chart: ChartLine, map: Map, bag: ShoppingBag, rocket: Rocket, compass: Compass, cpu: Cpu, link: Link2, network: Network, file: FileText, check: CheckCircle2, coin: Coins, user: UserRound, pin: MapPin, card: CreditCard, clipboard: ClipboardCheck };

/** Nav icon by the name used in app data. Lucide at stroke 2.75 (Organic). */
export const NavIcon: React.FC<{ name: string; size?: number }> = ({ name, size = 18 }) => {
  const I = MAP[name] || Circle;
  return <I size={size} strokeWidth={2.75} aria-hidden />;
};

/** App mark from registry path data (100×100 box). */
export const AppGlyph: React.FC<{ paths: IconPath[]; size?: number }> = ({ paths, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden overflow="visible">
    {paths.map((p, i) => (
      <path key={i} d={p.d} transform={p.tf} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} strokeLinecap="round" strokeLinejoin="round" />
    ))}
  </svg>
);
