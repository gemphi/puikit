# SPEC-002: Kuramoto Phase Synchronization & Bloch Sphere 3D Visualizer

## 1. Executive Summary & Theoretical Grounding

> **Deep Learning Concept Reference (Chollet DL Book §14.2)**:
> *"Collective synchronization across high-dimensional units represents a non-linear phase transition. Representing unit phases on a 3D sphere provides visual intuition of order versus chaos, allowing operators to spot cascade events in real time."*

`KuramotoPhaseSphere` visualizes multi-venue cryptocurrency order books, cognitive agents, and phasor states projected onto an interactive 3D unit sphere (Bloch / Poincaré representation).

---

## 2. Architectural Hierarchy Tree

```
puikit::components::3d::KuramotoPhaseSphere
├── 3D Unit Sphere Context (Three.js WebGL)
│   ├── SphereGeometry (Radius: 1.0, Wireframe / Translucent Glass Shader)
│   ├── Latitude & Longitude Coordinate Grid (Equator represents base phase ring)
│   └── Ambient & Directional Lighting Rig
├── Venue & Agent Phase Marker Projectors
│   ├── Individual Phase Markers: InstancedMesh Spheres at (cos θ_j, sin θ_j, z_j)
│   ├── Venue Color Assignment (Deribit: Green, Binance: Yellow, OKX: Blue, Hyperliquid: Purple)
│   └── Orbital Ring Traces (Visualizes frequency rotation velocity dθ_j/dt)
├── Global Order Parameter Arrow Engine
│   ├── Central Vector Arrow: Direction = mean phase Ψ(t), Length = R(t)
│   ├── Dynamic Color Interpolation: Cyan (R < 0.4) ──► Yellow (R ≈ 0.7) ──► Glowing Red (R ≥ 0.9)
│   └── Shockwave Pulse Shader: Emits expanding spherical ripples upon cascade trigger
└── Interactive HUD Overlay
    ├── Order Parameter Readout Gauge: R(t) = 0.00..1.00
    ├── Venue Synchronization Breakdown Table
    └── Emergency Circuit Breaker Trigger Button
```

---

## 3. Component Interaction & Execution Flow

```mermaid
flowchart TD
    A[Props Ingress: venuePhases, orderParameter, meanPhase] --> B[KuramotoPhaseSphere Component]
    
    subgraph "Three.js 3D Animation Loop"
        B --> C[Update Marker Positions: (cos θ_j, sin θ_j)]
        B --> D[Scale Global Order Vector Arrow: Length = R_t]
        
        D --> E{Order Parameter Threshold}
        E -- R_t < 0.60 --> F[Nominal Cyan Shading]
        E -- 0.60 ≤ R_t < 0.90 --> G[Elevated Yellow Shading]
        E -- R_t ≥ 0.90 --> H[Critical Red Shading & Shockwave Pulse]
        
        F --> I[Render 60fps GPU Frame]
        G --> I
        H --> I
    end
    
    subgraph "Event Notification"
        H --> J[Invoke onCascadeTrigger Callback]
        J --> K[Flash Visual Alert in Dashboard]
    end
```

---

## 4. Technical Specification & Data Structures

### 4.1 Component Props Specification

| Prop Name | TypeScript Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `venuePhases` | `VenuePhaseItem[]` | Yes | — | Array of venue IDs, current phase angles $\theta_j$, and weights |
| `orderParameter` | `number` | Yes | — | Global Kuramoto order parameter $R(t) \in [0.0, 1.0]$ |
| `meanPhase` | `number` | Yes | — | Mean collective phase angle $\Psi(t) \in [0, 2\pi)$ |
| `cascadeThreshold` | `number` | No | `0.90` | Threshold for triggering emergency cascade pulse |
| `width` | `number \| string` | No | `"100%"` | Canvas container width |
| `height` | `number \| string` | No | `450` | Canvas container height |
| `onCascadeTrigger` | `(r: number) => void` | No | `undefined` | Callback invoked when $R(t) \ge \text{threshold}$ |

---

## 5. TypeScript Component Signatures

```typescript
import React from 'react';

export interface VenuePhaseItem {
  venue: string;
  phase: number;
  weight: number;
  color?: string;
}

export interface KuramotoSphereProps {
  venuePhases: VenuePhaseItem[];
  orderParameter: number;
  meanPhase: number;
  cascadeThreshold?: number;
  width?: number | string;
  height?: number | string;
  onCascadeTrigger?: (orderParameter: number) => void;
}

export const KuramotoPhaseSphere: React.FC<KuramotoSphereProps> = ({
  venuePhases,
  orderParameter,
  meanPhase,
  cascadeThreshold = 0.90,
  width = '100%',
  height = 450,
  onCascadeTrigger,
}) => {
  // Implementation manages Three.js sphere context, order arrows, and pulse animations
  return <div style={{ width, height, position: 'relative' }} className="kuramoto-phase-sphere-3d" />;
};
```

---

## 6. Verification & Test Criteria

1. **Phase Arrow Scaling Accuracy**: Arrow vector length must strictly equal $R(t)$ scaled to the unit sphere radius ($1.0 \equiv \text{sphere surface}$).
2. **Cascade Pulse Trigger**: Incrementing `orderParameter` from $0.85$ to $0.92$ must invoke `onCascadeTrigger` within a single animation frame ($<16.6\text{ms}$).
3. **Multi-Venue Marker Rendering**: Rendering 50 simultaneous venue oscillators at $60\text{ fps}$ must consume $<8\%$ GPU utilization on standard hardware.
4. **Context Recovery**: Canvas context must automatically recover if the browser tab is backgrounded and restored.
