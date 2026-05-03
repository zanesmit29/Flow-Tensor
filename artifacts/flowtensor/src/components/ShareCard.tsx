import React, { forwardRef } from 'react';
import type { ParseResponse, FlowNode } from '@workspace/api-client-react';

const CARD_W = 1200;
const CARD_H = 630;
const HEADER_H = 74;
const FOOTER_H = 56;
const CONTENT_H = CARD_H - HEADER_H - FOOTER_H; // 500
const NODE_W = 178;
const NODE_H = 80;
const PAD_X = 80;
const PAD_Y = 50;

const NODE_STYLES: Record<string, { border: string; glow: string; text: string; label: string }> = {
  pandas:       { border: '#3b82f6', glow: 'rgba(59,130,246,0.28)',  text: '#93c5fd', label: 'Pandas' },
  pytorch:      { border: '#f97316', glow: 'rgba(249,115,22,0.28)',  text: '#fdba74', label: 'PyTorch' },
  input:        { border: '#22c55e', glow: 'rgba(34,197,94,0.28)',   text: '#86efac', label: 'Input' },
  output:       { border: '#ef4444', glow: 'rgba(239,68,68,0.28)',   text: '#fca5a5', label: 'Output' },
  intermediate: { border: '#a855f7', glow: 'rgba(168,85,247,0.28)', text: '#d8b4fe', label: 'Step' },
};

interface PlacedNode extends FlowNode {
  px: number;
  py: number;
  cx: number;
  cy: number;
}

function placeNodes(nodes: FlowNode[]): PlacedNode[] {
  if (!nodes.length) return [];
  const xs = nodes.map(n => n.position_x);
  const ys = nodes.map(n => n.position_y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const usableW = CARD_W - NODE_W - PAD_X * 2;
  const usableH = CONTENT_H - NODE_H - PAD_Y * 2;

  return nodes.map(n => {
    const px = PAD_X + ((n.position_x - minX) / rangeX) * usableW;
    const py = PAD_Y + ((n.position_y - minY) / rangeY) * usableH;
    return { ...n, px, py, cx: px + NODE_W / 2, cy: py + NODE_H / 2 };
  });
}

function cubicPath(x1: number, y1: number, x2: number, y2: number): string {
  const dy = Math.abs(y2 - y1) * 0.55;
  return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
}

function frameworkLabel(fw: string): string {
  const hasNumpy = fw.includes('numpy');
  const base = fw.replace('+numpy', '').replace('numpy', '');
  const parts: string[] = [];
  if (base === 'pandas') parts.push('Pandas');
  else if (base === 'pytorch') parts.push('PyTorch');
  else if (base === 'mixed') parts.push('Pandas', 'PyTorch');
  if (hasNumpy) parts.push('NumPy');
  return parts.length ? parts.join(' + ') : 'Pipeline';
}

interface ShareCardProps {
  data: ParseResponse | undefined;
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({ data }, ref) => {
  if (!data) return null;

  const placed = placeNodes(data.nodes);
  const nodeMap = new Map(placed.map(n => [n.id, n]));
  const label = frameworkLabel(data.framework);
  const stepCount = data.nodes.length;

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: -9999,
        top: 0,
        width: CARD_W,
        height: CARD_H,
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: 'linear-gradient(140deg, #04081a 0%, #080e26 30%, #0c1432 55%, #06091e 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* Center radial glow */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 72% 55% at 58% 52%, rgba(59,130,246,0.07) 0%, transparent 72%)',
      }} />

      {/* Corner vignette */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)',
      }} />

      {/* ── Header ── */}
      <div style={{
        position: 'relative', zIndex: 2,
        height: HEADER_H,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 52px',
        borderBottom: '1px solid rgba(255,255,255,0.065)',
      }}>
        {/* Logo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11,
            background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 22px rgba(59,130,246,0.4), 0 4px 12px rgba(0,0,0,0.4)',
          }}>
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.6px', lineHeight: 1 }}>
              FlowTensor
            </div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginTop: 3 }}>
              Graph Visualizer
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 14.5, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic',
          letterSpacing: '0.015em', fontWeight: 400,
        }}>
          Visualize your code pipeline
        </div>
      </div>

      {/* ── Graph content ── */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'hidden' }}>
        {/* SVG edges */}
        <svg
          width={CARD_W}
          height={CONTENT_H}
          style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', zIndex: 1 }}
        >
          <defs>
            {Object.entries(NODE_STYLES).map(([type, s]) => (
              <marker key={type} id={`a-${type}`} markerWidth="7" markerHeight="7" refX="5.5" refY="2.5" orient="auto">
                <path d="M0,0 L0,5 L7,2.5 z" fill={s.border} opacity="0.65" />
              </marker>
            ))}
          </defs>
          {data.edges.map(edge => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;
            const sType = (src.type as string) || 'intermediate';
            const col = NODE_STYLES[sType]?.border ?? '#888';
            return (
              <path
                key={edge.id}
                d={cubicPath(src.cx, src.py + NODE_H, tgt.cx, tgt.py)}
                fill="none"
                stroke={col}
                strokeWidth={1.8}
                strokeDasharray="7 5"
                opacity={0.5}
                markerEnd={`url(#a-${sType})`}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {placed.map(node => {
          const s = NODE_STYLES[(node.type as string)] ?? NODE_STYLES.intermediate;
          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: node.px,
                top: node.py,
                width: NODE_W,
                height: NODE_H,
                zIndex: 2,
                borderRadius: 13,
                border: `1.5px solid ${s.border}`,
                background: 'linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)',
                boxShadow: `0 0 20px ${s.glow}, 0 6px 20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '0 14px',
              }}
            >
              {/* Type pill */}
              <div style={{
                fontSize: 8.5,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: s.text,
                background: `${s.border}1e`,
                padding: '2px 9px',
                borderRadius: 4,
              }}>
                {s.label}
              </div>

              {/* Op name */}
              <div style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: '#ffffff',
                fontFamily: '"Courier New", Courier, monospace',
                textAlign: 'center',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.2px',
              }}>
                {node.label}
              </div>

              {/* Shape */}
              {(node.output_shape || node.input_shape) && (
                <div style={{
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.38)',
                  fontFamily: '"Courier New", Courier, monospace',
                  background: 'rgba(255,255,255,0.06)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {node.output_shape ?? node.input_shape}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div style={{
        position: 'relative', zIndex: 2,
        height: FOOTER_H,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 52px',
        borderTop: '1px solid rgba(255,255,255,0.065)',
      }}>
        {/* Step count + framework */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {(() => {
            const fw = data.framework;
            const hasNumpy = fw.includes('numpy');
            const baseFw = fw.replace('+numpy', '').replace('numpy', '');
            let dot: string;
            if (hasNumpy && !baseFw) dot = '#f59e0b';
            else if (baseFw === 'pytorch') dot = '#f97316';
            else if (baseFw === 'pandas') dot = '#3b82f6';
            else dot = '#a855f7';
            return (
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: dot,
                boxShadow: `0 0 8px ${dot}`,
              }} />
            );
          })()}
          <div style={{
            fontSize: 13.5, color: 'rgba(255,255,255,0.52)', fontWeight: 600,
            letterSpacing: '-0.1px',
          }}>
            {stepCount} steps · {label}
          </div>
        </div>

        {/* Domain */}
        <div style={{
          fontSize: 11.5, color: 'rgba(255,255,255,0.18)',
          fontFamily: '"Courier New", Courier, monospace',
          letterSpacing: '0.06em',
        }}>
          flowtensor.replit.app
        </div>
      </div>
    </div>
  );
});

ShareCard.displayName = 'ShareCard';
export default ShareCard;
