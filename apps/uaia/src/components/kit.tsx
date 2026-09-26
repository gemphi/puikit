import React from 'react';
import s from '../styles/uaia.module.scss';

/** Uppercase instrumentation label with the leading tick line. */
export const Micro: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className={s.micro}>{children}</span>
);

/* ------------------------------------------------------------------- */
/* Hero patterns — geometric progressions of one shape, three layers,  */
/* ascending and descending in size, a different arrangement per page. */
/* ------------------------------------------------------------------- */

type Run = 'asc' | 'desc' | 'peak' | 'valley';

export interface PatternSpec {
  /** Base shape. A diamond is the same square rotated 45°. */
  shape: 'square' | 'diamond';
  /** Concentric children per shape (1–3). */
  nested?: number;
  /** Largest shape size in px. */
  base?: number;
  /** How each of the three layers runs across the hero. */
  runs: [Run, Run, Run];
  /** Shapes per layer. */
  count?: number;
  /** Extra rotation on top of the shape's own. */
  rot?: number;
  tone?: 'cyan' | 'violet';
}

/** One distinct progression per page. */
export const HERO_PATTERNS: Record<string, PatternSpec> = {
  home: { shape: 'square', nested: 2, base: 96, runs: ['asc', 'desc', 'asc'], count: 9, tone: 'cyan' },
  about: { shape: 'diamond', nested: 1, base: 84, runs: ['desc', 'asc', 'desc'], count: 10, tone: 'violet' },
  mission: { shape: 'diamond', nested: 3, base: 110, runs: ['peak', 'valley', 'peak'], count: 9, tone: 'cyan' },
  governance: { shape: 'square', nested: 3, base: 100, runs: ['asc', 'asc', 'asc'], count: 8, tone: 'violet' },
  leadership: { shape: 'diamond', nested: 2, base: 124, runs: ['valley', 'peak', 'valley'], count: 7, tone: 'cyan' },
  framework: { shape: 'square', nested: 1, base: 64, runs: ['asc', 'desc', 'asc'], count: 13, tone: 'cyan' },
  evaluations: { shape: 'diamond', nested: 2, base: 92, runs: ['desc', 'desc', 'desc'], count: 9, rot: 0, tone: 'violet' },
  certification: { shape: 'square', nested: 2, base: 76, runs: ['peak', 'peak', 'peak'], count: 11, rot: 8, tone: 'cyan' },
  standards: { shape: 'square', nested: 1, base: 48, runs: ['asc', 'desc', 'asc'], count: 16, tone: 'violet' },
  partnerships: { shape: 'diamond', nested: 1, base: 116, runs: ['asc', 'valley', 'desc'], count: 8, tone: 'cyan' },
  newsroom: { shape: 'square', nested: 3, base: 120, runs: ['desc', 'peak', 'asc'], count: 7, tone: 'cyan' },
  research: { shape: 'diamond', nested: 3, base: 86, runs: ['peak', 'asc', 'valley'], count: 9, rot: 10, tone: 'violet' },
  policy: { shape: 'square', nested: 2, base: 104, runs: ['valley', 'valley', 'valley'], count: 8, rot: 14, tone: 'violet' },
  careers: { shape: 'diamond', nested: 2, base: 70, runs: ['asc', 'desc', 'peak'], count: 12, tone: 'cyan' },
  contact: { shape: 'square', nested: 2, base: 90, runs: ['desc', 'asc', 'valley'], count: 9, rot: 22, tone: 'violet' },
  legal: { shape: 'diamond', nested: 1, base: 58, runs: ['desc', 'desc', 'asc'], count: 14, tone: 'cyan' },
  notfound: { shape: 'diamond', nested: 2, base: 98, runs: ['peak', 'desc', 'asc'], count: 8, tone: 'violet' },
};

/** Size factor 0..1 along a run. */
const runFactor = (run: Run, t: number): number => {
  switch (run) {
    case 'asc': return t;
    case 'desc': return 1 - t;
    case 'peak': return 1 - Math.abs(2 * t - 1);
    case 'valley': return Math.abs(2 * t - 1);
  }
};

/**
 * Three horizontal layers of one shape marching across the hero, each layer
 * ascending, descending, peaking or dipping in size.
 */
export const HeroPattern: React.FC<{ id: string; spec: PatternSpec }> = ({ id, spec }) => {
  const { shape, nested = 1, base = 90, runs, count = 9, rot = 0, tone = 'cyan' } = spec;
  const angle = rot + (shape === 'diamond' ? 45 : 0);
  const W = 1200;
  const H = 520;
  const rowY = [110, 260, 410];
  const rowO = [0.5, 0.34, 0.22];
  const cells = Array.from({ length: count }, (_, i) => i);
  // Every pattern draws with the same brand gradient and the same 1px line;
  // each layer takes the gradient at a different angle, and the page's tone
  // decides which end leads.
  const stops = tone === 'violet' ? ['#818cf8', '#22d3ee'] : ['#22d3ee', '#818cf8'];
  const dirs = [
    { x1: 0, y1: 0, x2: 1, y2: 0 },
    { x1: 0, y1: 0, x2: 1, y2: 1 },
    { x1: 0, y1: 0, x2: 0, y2: 1 },
  ];
  return (
    <svg
      className={s.heroPattern}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMaxYMid slice"
      width="100%"
      height="100%"
      aria-hidden
    >
      <defs>
        {dirs.map((d, di) => (
          <linearGradient key={di} id={`${id}-g${di}`} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}>
            <stop offset="0%" stopColor={stops[0]} />
            <stop offset="100%" stopColor={stops[1]} />
          </linearGradient>
        ))}
      </defs>
      {runs.map((run, li) => (
        <g key={li} opacity={rowO[li]}>
          {cells.map((i) => {
            const t = count > 1 ? i / (count - 1) : 0;
            const size = base * (0.24 + 0.76 * runFactor(run, t));
            const cx = (W / count) * (i + 0.5);
            const cy = rowY[li];
            return (
              <g key={i} transform={`rotate(${angle} ${cx} ${cy})`}>
                {Array.from({ length: nested }, (_, n) => {
                  const w = size * (1 - n * 0.34);
                  return w > 3 ? (
                    <rect
                      key={n}
                      x={cx - w / 2}
                      y={cy - w / 2}
                      width={w}
                      height={w}
                      fill="none"
                      stroke={`url(#${id}-g${li})`}
                      strokeWidth={1}
                      opacity={1 - n * 0.28}
                    />
                  ) : null;
                })}
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
};

/** Deterministic pseudo-random starfield, hairline dots only. */
export const Starfield: React.FC = () => {
  const stars = React.useMemo(() => {
    let seed = 42;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: 70 }, () => ({ x: rnd() * 100, y: rnd() * 100, r: rnd() * 1.1 + 0.2, o: rnd() * 0.5 + 0.15 }));
  }, []);
  return (
    <svg className={s.heroStars} width="100%" height="100%" preserveAspectRatio="none" aria-hidden>
      {stars.map((st, i) => (
        <circle key={i} cx={`${st.x}%`} cy={`${st.y}%`} r={st.r} fill="#9dd6ff" opacity={st.o} />
      ))}
    </svg>
  );
};

/** Per-page hero band: label, headline, sub, extras, its own pattern. */
export const Hero: React.FC<{
  label: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  pattern?: keyof typeof HERO_PATTERNS;
  children?: React.ReactNode;
}> = ({ label, title, sub, pattern, children }) => (
  <header className={s.hero}>
    {pattern && HERO_PATTERNS[pattern] ? (
      <HeroPattern id={`hp-${pattern}`} spec={HERO_PATTERNS[pattern]} />
    ) : (
      <div className={s.heroGrid} aria-hidden />
    )}
    <Starfield />
    <div className={s.heroInner}>
      <Micro>{label}</Micro>
      <h1 className={s.heroTitle}>{title}</h1>
      {sub && <p className={s.heroSub}>{sub}</p>}
      {children}
    </div>
  </header>
);

/** Consistent content section: optional micro label + title + intro. */
export const Block: React.FC<{
  label?: string;
  title?: React.ReactNode;
  intro?: React.ReactNode;
  tight?: boolean;
  children?: React.ReactNode;
}> = ({ label, title, intro, tight, children }) => (
  <section className={`${s.section} ${tight ? s.sectionTight : ''}`}>
    {label && <Micro>{label}</Micro>}
    {title && <h2 className={s.sectionTitle}>{title}</h2>}
    {intro && <p className={s.sectionIntro}>{intro}</p>}
    {children}
  </section>
);

/**
 * Glass panel with the signature faint gradient: color at low opacity fading
 * to transparent at the halfway mark. Default runs top to bottom; `dir` turns
 * it sideways, and `tone` switches between the signal cyan and the indigo.
 */
export const Glass: React.FC<{
  seat?: boolean;
  dir?: 'down' | 'right' | 'left';
  tone?: 'cyan' | 'violet';
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ seat, dir = 'down', tone = 'cyan', className, style, children }) => {
  const cls = [
    s.glass,
    seat ? s.seat : '',
    dir === 'right' ? s.gradRight : dir === 'left' ? s.gradLeft : '',
    tone === 'violet' ? s.glassViolet : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
};

/**
 * The house note panel — replaces any prebaked callout so every surface on
 * the site is the same glass-gradient object.
 */
export const Note: React.FC<{
  title?: string;
  tone?: 'cyan' | 'violet';
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ title, tone = 'cyan', style, children }) => (
  <Glass tone={tone} style={{ marginTop: 16, ...style }}>
    {title && (
      <div
        className={s.mono}
        style={{
          color: tone === 'violet' ? '#818cf8' : 'var(--phi-color-primary)',
          fontSize: 12,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        {title}
      </div>
    )}
    <div style={{ lineHeight: 1.7 }}>{children}</div>
  </Glass>
);

/**
 * Auto-fit responsive card grid. With exactly two children the gradients
 * oppose each other: the first runs left to right, the second right to left.
 */
export const AutoGrid: React.FC<{ min?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  min = 260,
  style,
  children,
}) => {
  const two = React.Children.count(children) === 2;
  return (
    <div
      className={two ? s.altGrid : undefined}
      style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 16, ...style }}
    >
      {children}
    </div>
  );
};
