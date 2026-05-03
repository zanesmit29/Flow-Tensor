import React from "react";
import type { ShapeCategory } from "@/lib/shapeMap";

interface ShapeProps {
  width: number;
  height: number;
  color: string;
}

const FILL_OPACITY = 0.18;
const STROKE_WIDTH = 1.5;

function svgProps(w: number, h: number) {
  return {
    width: w,
    height: h,
    viewBox: `0 0 ${w} ${h}`,
    xmlns: "http://www.w3.org/2000/svg",
    className: "absolute inset-0 pointer-events-none overflow-visible",
  } as const;
}

export function CylinderShape({ width: w, height: h, color }: ShapeProps) {
  const ry = 7;
  const path = `
    M 0,${ry}
    A ${w / 2},${ry} 0 0 1 ${w},${ry}
    L ${w},${h - ry}
    A ${w / 2},${ry} 0 0 1 ${w / 2},${h}
    A ${w / 2},${ry} 0 0 1 0,${h - ry}
    Z
  `.trim();
  return (
    <svg {...svgProps(w, h)}>
      <path d={path} fill={color} fillOpacity={FILL_OPACITY} stroke={color} strokeWidth={STROKE_WIDTH} />
      <ellipse cx={w / 2} cy={ry} rx={w / 2 - 0.75} ry={ry - 0.5} fill={color} fillOpacity={0.05} stroke={color} strokeWidth={STROKE_WIDTH} />
    </svg>
  );
}

export function FunnelShape({ width: w, height: h, color }: ShapeProps) {
  const points = `1,1 ${w - 1},1 ${w * 0.72},${h - 1} ${w * 0.28},${h - 1}`;
  return (
    <svg {...svgProps(w, h)}>
      <polygon points={points} fill={color} fillOpacity={FILL_OPACITY} stroke={color} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
    </svg>
  );
}

export function ParallelogramShape({ width: w, height: h, color }: ShapeProps) {
  const skew = 16;
  const points = `${skew},1 ${w - 1},1 ${w - skew},${h - 1} 1,${h - 1}`;
  return (
    <svg {...svgProps(w, h)}>
      <polygon points={points} fill={color} fillOpacity={FILL_OPACITY} stroke={color} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
    </svg>
  );
}

export function HexagonShape({ width: w, height: h, color }: ShapeProps) {
  const c = w * 0.14;
  const points = `${c},1 ${w - c},1 ${w - 1},${h / 2} ${w - c},${h - 1} ${c},${h - 1} 1,${h / 2}`;
  return (
    <svg {...svgProps(w, h)}>
      <polygon points={points} fill={color} fillOpacity={FILL_OPACITY} stroke={color} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
    </svg>
  );
}

export function DiamondShape({ width: w, height: h, color }: ShapeProps) {
  const points = `${w / 2},1 ${w - 1},${h / 2} ${w / 2},${h - 1} 1,${h / 2}`;
  return (
    <svg {...svgProps(w, h)}>
      <polygon points={points} fill={color} fillOpacity={FILL_OPACITY} stroke={color} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
    </svg>
  );
}

export function StadiumShape({ width: w, height: h, color }: ShapeProps) {
  const r = h / 2;
  return (
    <svg {...svgProps(w, h)}>
      <rect x={1} y={1} width={w - 2} height={h - 2} rx={r} ry={r}
        fill={color} fillOpacity={FILL_OPACITY} stroke={color} strokeWidth={STROKE_WIDTH} />
    </svg>
  );
}

export function LayerShape({ width: w, height: h, color }: ShapeProps) {
  const stripeW = 5;
  return (
    <svg {...svgProps(w, h)}>
      <rect x={1} y={1} width={w - 2} height={h - 2} rx={6} ry={6}
        fill={color} fillOpacity={FILL_OPACITY} stroke={color} strokeWidth={STROKE_WIDTH} />
      <rect x={1} y={1} width={stripeW} height={h - 2} rx={2} ry={2} fill={color} />
    </svg>
  );
}

export function WavyShape({ width: w, height: h, color }: ShapeProps) {
  const a = 5;
  const topY = a + 1;
  const botY = h - a - 1;
  const path = `
    M 1,${topY}
    Q ${w * 0.25},${1} ${w * 0.5},${topY}
    T ${w - 1},${topY}
    L ${w - 1},${botY}
    Q ${w * 0.75},${h - 1} ${w * 0.5},${botY}
    T 1,${botY}
    Z
  `.trim();
  return (
    <svg {...svgProps(w, h)}>
      <path d={path} fill={color} fillOpacity={FILL_OPACITY} stroke={color} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
    </svg>
  );
}

export function ShieldShape({ width: w, height: h, color }: ShapeProps) {
  const path = `
    M 1,1
    L ${w - 1},1
    L ${w - 1},${h * 0.55}
    Q ${w - 1},${h * 0.78} ${w / 2},${h - 1}
    Q 1,${h * 0.78} 1,${h * 0.55}
    Z
  `.trim();
  return (
    <svg {...svgProps(w, h)}>
      <path d={path} fill={color} fillOpacity={FILL_OPACITY} stroke={color} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
    </svg>
  );
}

export const SHAPE_COMPONENTS: Record<ShapeCategory, React.FC<ShapeProps>> = {
  "data-source": CylinderShape,
  "filter": FunnelShape,
  "transform": ParallelogramShape,
  "aggregate": HexagonShape,
  "merge": DiamondShape,
  "output": StadiumShape,
  "pytorch-layer": LayerShape,
  "activation": WavyShape,
  "loss-optimizer": ShieldShape,
};
