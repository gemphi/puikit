import React, { useMemo } from 'react';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';

export type WorldSceneProps = {
  /** Same seed → same scene (use the world / record id). */
  seed: string;
  /** Base colour of the scene (any CSS colour or var()). Defaults to the theme primary. */
  color?: string;
  /** Night scene: shades lighten toward white instead of darkening. */
  night?: boolean;
  /** Background texture. Defaults to one picked by the seed. */
  pattern?: 'dots' | 'lines' | 'rings' | 'none';
  className?: string;
  title?: string;
};

const W = 640, H = 400;
const rng = (seed: string) => { let h = 2166136261; for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619); let s = (h >>> 0) || 1; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; };

/** A smooth hill line through n random heights, closed to the bottom edge. */
const hill = (r: () => number, base: number, amp: number, n: number) => {
  const pts = Array.from({ length: n + 1 }, (_, i) => [(i / n) * W, base - r() * amp] as const);
  let d = `M0 ${H} L0 ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; const mx = (x0 + x1) / 2; d += ` C${mx.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`; }
  return d + ` L${W} ${H} Z`;
};

/**
 * A seeded world backdrop in SVG: sky, texture, layered hills, pillars — and a sun cut like every profile circle in
 * puijs: an outer ring, one shade on the top semicircle, and the bottom semicircle cut in half into two shades.
 * All colours are mixes of one base colour, so the scene follows the theme and palette.
 */
export const WorldScene = ({ seed, color = 'var(--phi-color-primary)', night = false, pattern, className, title }: WorldSceneProps) => {
  const s = useMemo(() => {
    const r = rng(seed);
    const pat = pattern ?? (['dots', 'lines', 'rings', 'dots'] as const)[Math.floor(r() * 4)];
    const sun = { cx: 90 + r() * 220, cy: 135 + r() * 45, r: 42 + r() * 18 };
    const hills = [0, 1, 2, 3].map((i) => hill(r, 210 + i * 45, 70 - i * 8, 3 + Math.floor(r() * 3)));
    const pillars = Array.from({ length: 3 + Math.floor(r() * 3) }, () => ({ x: 30 + r() * 580, w: 10 + r() * 12, h: 70 + r() * 90 }));
    return { pat, sun, hills, pillars };
  }, [seed, pattern]);
  const toward = night ? '#ffffff' : '#000000';
  const mix = (pct: number, to = 'var(--phi-color-background, #fff)') => `color-mix(in srgb, ${color} ${pct}%, ${to})`;
  const deep = (pct: number) => `color-mix(in srgb, ${color} ${100 - pct}%, ${toward})`;
  const id = 'ws' + seed.replace(/[^a-z0-9]/gi, '');
  const sky0 = night ? deep(78) : mix(26), sky1 = night ? deep(64) : mix(40);
  const { cx, cy, r: R } = s.sun; const ri = R * 0.8;
  return (
    <svg className={cn(styles.scene, className)} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={id + 'sky'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: sky0 }} /><stop offset="1" style={{ stopColor: sky1 }} /></linearGradient>
        <pattern id={id + 'dots'} width="38" height="38" patternUnits="userSpaceOnUse"><circle cx="19" cy="19" r="2" style={{ fill: night ? mix(30, '#fff') : deep(30) }} opacity="0.35" /></pattern>
        <pattern id={id + 'lines'} width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="1" style={{ fill: night ? mix(40, '#fff') : deep(25) }} opacity="0.25" /></pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}sky)`} />
      {s.pat === 'dots' && <rect width={W} height={H} fill={`url(#${id}dots)`} />}
      {s.pat === 'lines' && <rect width={W} height={H} fill={`url(#${id}lines)`} />}
      {s.pat === 'rings' && [0, 1, 2].map((i) => <ellipse key={i} cx={cx + 140} cy={cy + 120} rx={300 - i * 70} ry={120 - i * 26} transform={`rotate(-12 ${cx + 140} ${cy + 120})`} fill="none" style={{ stroke: deep(30) }} strokeOpacity="0.3" strokeWidth="1.5" />)}
      {/* The sun, cut like the profile circles: ring · top semicircle · bottom-left quarter · bottom-right quarter */}
      <g data-part="sun">
        <circle cx={cx} cy={cy} r={R} style={{ fill: night ? deep(55) : mix(62) }} />
        <path d={`M${cx - ri} ${cy} A${ri} ${ri} 0 0 1 ${cx + ri} ${cy} Z`} style={{ fill: night ? deep(40) : mix(78) }} />
        <path d={`M${cx} ${cy} L${cx - ri} ${cy} A${ri} ${ri} 0 0 0 ${cx} ${cy + ri} Z`} style={{ fill: night ? deep(30) : deep(12) }} />
        <path d={`M${cx} ${cy} L${cx} ${cy + ri} A${ri} ${ri} 0 0 0 ${cx + ri} ${cy} Z`} style={{ fill: night ? deep(48) : deep(24) }} />
      </g>
      <path d={s.hills[0]} style={{ fill: night ? deep(50) : mix(58) }} opacity="0.9" />
      {s.pillars.map((p, i) => (
        <path key={i} d={`M${p.x} ${H * 0.62} V${H * 0.62 - p.h + p.w / 2} a${p.w / 2} ${p.w / 2} 0 0 1 ${p.w} 0 V${H * 0.62} Z`} style={{ fill: night ? deep(38) : deep(30) }} opacity="0.7" />
      ))}
      <path d={s.hills[1]} style={{ fill: night ? deep(42) : mix(80) }} opacity="0.92" />
      <path d={s.hills[2]} style={{ fill: night ? deep(30) : deep(18) }} opacity="0.95" />
      <path d={s.hills[3]} style={{ fill: night ? deep(18) : deep(34) }} />
    </svg>
  );
};
