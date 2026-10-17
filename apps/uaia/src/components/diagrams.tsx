import React from 'react';
import { Box, Text, Title } from '@pui/components';
import { Glass, AutoGrid } from './kit';
import s from '../styles/uaia.module.scss';

/** Polar helper: SVG coordinates for an angle (degrees) and radius. */
const P = (cx: number, cy: number, deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const s0 = P(cx, cy, a0, r);
  const s1 = P(cx, cy, a1, r);
  return `M ${s0.x.toFixed(1)} ${s0.y.toFixed(1)} A ${r} ${r} 0 0 1 ${s1.x.toFixed(1)} ${s1.y.toFixed(1)}`;
};

/**
 * The EAE spiral — Envision, Apply, Eval, Approve/Decline.
 *
 * Four quarter-turns of one spiral, tightening toward the centre. The final
 * segment is a single gate with two opposite outcomes, and on approval the
 * spiral repeats at the next major version.
 */
export const EAESpiral: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const cx = 320;
  const cy = 330;
  const SEGS = [
    { n: '01', name: 'ENVISION', r: 252, a0: -90, a1: 0, tone: '#22d3ee' },
    { n: '02', name: 'APPLY', r: 208, a0: 0, a1: 90, tone: '#4fc3e8' },
    { n: '03', name: 'EVAL', r: 166, a0: 90, a1: 180, tone: '#6ba7f0' },
    { n: '04', name: 'APPROVE / DECLINE', r: 128, a0: 180, a1: 270, tone: '#818cf8' },
  ];
  const labelAt = (deg: number, r: number) => P(cx, cy, deg, r);
  const end = P(cx, cy, 270, 128); // top of the innermost quarter — the gate
  return (
    <svg
      viewBox="0 0 640 660"
      role="img"
      aria-label="The EAE spiral: Envision, Apply, Eval, then Approve or Decline"
      style={{ width: '100%', maxWidth: compact ? 460 : 620, height: 'auto', display: 'block', margin: '0 auto' }}
    >
      <defs>
        <linearGradient id="eae-sig" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <marker id="eae-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#818cf8" />
        </marker>
        <marker id="eae-ok" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#34d399" />
        </marker>
        <marker id="eae-no" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#fb7185" />
        </marker>
      </defs>

      {/* faint reference rings */}
      {[252, 208, 166, 128].map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="#22d3ee" strokeWidth="0.5" opacity="0.10" />
      ))}

      {/* the four quarter-turns */}
      {SEGS.map((seg, i) => (
        <g key={seg.n}>
          <path
            d={arc(cx, cy, seg.r, seg.a0, seg.a1)}
            fill="none"
            stroke="url(#eae-sig)"
            strokeWidth={3}
            strokeLinecap="round"
            markerEnd={i < 3 ? 'url(#eae-arrow)' : undefined}
          />
          {/* radial step down to the next, tighter turn */}
          {i < 3 && (
            <line
              x1={P(cx, cy, seg.a1, seg.r).x}
              y1={P(cx, cy, seg.a1, seg.r).y}
              x2={P(cx, cy, seg.a1, SEGS[i + 1].r).x}
              y2={P(cx, cy, seg.a1, SEGS[i + 1].r).y}
              stroke="#818cf8"
              strokeWidth={1.4}
              strokeDasharray="3 4"
              opacity={0.7}
            />
          )}
        </g>
      ))}

      {/* segment labels, riding just outside each turn */}
      {(
        [
          { deg: -47, r: 284, seg: SEGS[0], anchor: 'start' },
          { deg: 46, r: 244, seg: SEGS[1], anchor: 'start' },
          { deg: 135, r: 208, seg: SEGS[2], anchor: 'end' },
          { deg: 226, r: 172, seg: SEGS[3], anchor: 'end' },
        ] as const
      ).map(({ deg, r, seg, anchor }) => {
        const p = labelAt(deg, r);
        return (
          <g key={seg.n} fontFamily="'Chakra Petch', 'Space Grotesk', monospace">
            <text x={p.x} y={p.y - 8} textAnchor={anchor} fontSize="12" fill={seg.tone} letterSpacing="3">
              {seg.n}
            </text>
            <text x={p.x} y={p.y + 10} textAnchor={anchor} fontSize="15" fontWeight="600" fill="var(--phi-color-text-primary, #e6edf6)" letterSpacing="2">
              {seg.name}
            </text>
          </g>
        );
      })}

      {/* the gate: one segment, two opposite outcomes */}
      <circle cx={end.x} cy={end.y} r={7} fill="#0b1533" stroke="url(#eae-sig)" strokeWidth={2} />
      <line x1={end.x} y1={end.y - 8} x2={end.x + 66} y2={end.y - 52} stroke="#34d399" strokeWidth={2.4} markerEnd="url(#eae-ok)" />
      <line x1={end.x} y1={end.y + 8} x2={end.x + 66} y2={end.y + 52} stroke="#fb7185" strokeWidth={2.4} markerEnd="url(#eae-no)" />
      <g fontFamily="'Chakra Petch', 'Space Grotesk', monospace" fontSize="13" fontWeight="600" letterSpacing="2">
        <text x={end.x + 74} y={end.y - 52} fill="#34d399">APPROVE</text>
        <text x={end.x + 74} y={end.y + 58} fill="#fb7185">DECLINE</text>
      </g>
      <g fontFamily="'Inter', sans-serif" fontSize="10.5" opacity="0.75">
        <text x={end.x + 74} y={end.y - 37} fill="var(--phi-color-text-secondary, #9aa7bd)">certificate issued; the spiral</text>
        <text x={end.x + 74} y={end.y - 24} fill="var(--phi-color-text-secondary, #9aa7bd)">repeats at the next version</text>
        <text x={end.x + 74} y={end.y + 72} fill="var(--phi-color-text-secondary, #9aa7bd)">reasons published; re-entry</text>
        <text x={end.x + 74} y={end.y + 85} fill="var(--phi-color-text-secondary, #9aa7bd)">at Envision, remedied</text>
      </g>

      {/* centre mark */}
      <g fontFamily="'Space Grotesk', sans-serif" textAnchor="middle">
        <text x={cx} y={cy - 2} fontSize="30" fontWeight="700" fill="url(#eae-sig)" letterSpacing="6">
          EAE
        </text>
        <text x={cx} y={cy + 20} fontSize="10.5" fill="var(--phi-color-text-secondary, #9aa7bd)" letterSpacing="3">
          THE EVALUATION SPIRAL
        </text>
      </g>
    </svg>
  );
};

const EAE_STEPS = [
  {
    n: '01',
    t: 'Envision',
    tone: 'cyan' as const,
    b: 'The developer and the Agency set out the intended capability and safety envelope of the model, before any measurement takes place.',
  },
  {
    n: '02',
    t: 'Apply',
    tone: 'violet' as const,
    b: 'The developer submits the model, together with its evidence, into the Model Market Authorization by way of a Model Notification.',
  },
  {
    n: '03',
    t: 'Eval',
    tone: 'cyan' as const,
    b: 'The Technical Directorate carries out the five tracks of UAIA-EVAL and draws up the Evaluation Report with its risk tier.',
  },
  {
    n: '04',
    t: 'Approve / Decline',
    tone: 'violet' as const,
    b: 'One gate, two opposite outcomes. Approval issues a certificate and the spiral turns again at the next major version; a decline is published with its reasons, and the model may re-enter at Envision once remedied.',
  },
];

/** The spiral plus its four steps, spelled out. */
export const EAEFramework: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <>
    <Glass tone="violet" style={{ marginTop: 20 }}>
      <EAESpiral compact={compact} />
    </Glass>
    <Box style={{ marginTop: 16 }}>
      <AutoGrid min={240}>
        {EAE_STEPS.map((st) => (
          <Glass key={st.n} tone={st.tone}>
            <Box as="span" className={s.mono} style={{ color: st.tone === 'cyan' ? '#22d3ee' : '#818cf8', fontSize: 12, letterSpacing: '0.2em' }}>
              {st.n}
            </Box>
            <Title level={5} style={{ marginTop: 6 }}>{st.t}</Title>
            <Text size="sm" intent="secondary" style={{ lineHeight: 1.65 }}>{st.b}</Text>
          </Glass>
        ))}
      </AutoGrid>
    </Box>
  </>
);
