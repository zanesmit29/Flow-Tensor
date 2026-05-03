import React, { useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  getViewportForBounds,
  Edge,
  Node as FlowFlowNode,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { motion } from 'framer-motion';
import { Zap, Share2, Loader2 } from 'lucide-react';
import CustomNode from './CustomNode';
import type { ParseResponse, FlowNode as ApiFlowNode } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

const nodeTypes = { custom: CustomNode };

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;

interface GraphCanvasProps {
  data?: ParseResponse;
  isPending: boolean;
}

function GraphCanvasInner({ data, isPending }: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isExporting, setIsExporting] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { getNodes, fitView } = useReactFlow();
  const { toast } = useToast();

  useEffect(() => {
    if (data?.nodes && data?.edges) {
      const newNodes = data.nodes.map((node: ApiFlowNode, index: number) => ({
        id: node.id,
        type: 'custom',
        position: { x: node.position_x || 0, y: node.position_y || index * 100 },
        data: { ...node, index },
      }));

      const newEdges = data.edges.map((edge) => {
        const sourceNode = data.nodes.find((n) => n.id === edge.source);
        const color = getNodeColor(sourceNode?.type || 'intermediate');
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          animated: true,
          style: { stroke: color, strokeWidth: 2, strokeDasharray: '6 3' },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        };
      });

      setNodes(newNodes);
      setEdges(newEdges);

      // After nodes mount and React Flow measures their sizes,
      // fit the viewport so all of them are visible.
      // Two RAFs + small timeout = nodes have a measured width/height.
      const t = setTimeout(() => {
        fitView({ padding: 0.2, duration: 600, maxZoom: 1.2 });
      }, 120);
      return () => clearTimeout(t);
    } else {
      setNodes([]);
      setEdges([]);
    }
    return undefined;
  }, [data, setNodes, setEdges, fitView]);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      // Fit all nodes into view first
      fitView({ padding: 0.15 });
      await new Promise(r => setTimeout(r, 350));

      // Hide React Flow chrome (controls, panels) during capture
      const wrapper = wrapperRef.current;
      if (wrapper) wrapper.classList.add('rf-exporting');
      await new Promise(r => setTimeout(r, 60));

      const rfNodes = getNodes();

      // Manually compute bounding rect of all nodes
      const xs = rfNodes.flatMap(n => [n.position.x, n.position.x + (n.measured?.width ?? 150)]);
      const ys = rfNodes.flatMap(n => [n.position.y, n.position.y + (n.measured?.height ?? 60)]);
      const bounds = {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      };

      // getViewportForBounds returns {x, y, zoom} Viewport
      const vp = getViewportForBounds(bounds, IMAGE_WIDTH, IMAGE_HEIGHT, 0.5, 2, 40);

      const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null;
      if (!viewport) throw new Error('React Flow viewport not found');

      const options = {
        backgroundColor: '#0f1117',
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
        style: {
          width: `${IMAGE_WIDTH}px`,
          height: `${IMAGE_HEIGHT}px`,
          transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`,
        },
      };

      // Call toPng twice — first pass warms up font/style caches,
      // second pass produces the reliable output
      await toPng(viewport, options);
      const dataUrl = await toPng(viewport, options);

      // Download
      const link = document.createElement('a');
      link.download = 'flowtensor-pipeline.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Copy tweet
      const url = window.location.origin;
      const tweet = `Just visualized my ML pipeline with FlowTensor 🔥\nCheck it out → ${url}\n#DataScience #PyTorch #100DaysOfML`;
      await navigator.clipboard.writeText(tweet).catch(() => {});

      toast({
        title: 'Card downloaded + tweet copied to clipboard 🚀',
        description: 'flowtensor-pipeline.png saved to your downloads.',
      });
    } catch (err) {
      toast({
        title: 'Export failed — try zooming out first',
        description: String(err),
        variant: 'destructive',
      });
    } finally {
      if (wrapperRef.current) wrapperRef.current.classList.remove('rf-exporting');
      setIsExporting(false);
    }
  };

  if (!data?.nodes?.length && !isPending) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-[#0f1117]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="z-10 flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
            <div className="w-24 h-24 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-xl flex items-center justify-center shadow-2xl relative z-10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20" />
              <Zap className="w-10 h-10 text-blue-400" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Paste your code and watch it come alive
          </h2>
          <p className="text-white/40 max-w-sm text-center text-sm leading-relaxed">
            FlowTensor analyzes your PyTorch or Pandas operations and renders a glowing interactive graph of the data flow.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="w-full h-full relative bg-[#0f1117] react-flow-wrapper">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent"
        minZoom={0.1}
        maxZoom={4}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.05)" />
        <Controls className="fill-white !bg-[#1a1d24] !border-white/10 !shadow-2xl" />
      </ReactFlow>

      {/* Framework badge */}
      {data?.framework && data.framework !== 'unknown' && (
        <div className="absolute bottom-6 right-6 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-sm font-medium flex items-center gap-2 shadow-xl text-white">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            data.framework === 'pytorch' ? 'bg-[#f97316] shadow-[0_0_8px_#f97316]' :
            data.framework === 'pandas'  ? 'bg-[#3b82f6] shadow-[0_0_8px_#3b82f6]' :
            'bg-purple-500 shadow-[0_0_8px_#a855f7]'
          }`} />
          <span className="capitalize">{data.framework} Detected</span>
        </div>
      )}

      {/* Share button — floats in top-right of canvas */}
      {data?.nodes?.length ? (
        <motion.button
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExport}
          disabled={isExporting}
          className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-purple-500/30 bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-purple-200 hover:from-blue-600/35 hover:to-purple-600/35 hover:border-purple-400/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed backdrop-blur-md shadow-lg"
        >
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Share2 className="w-3.5 h-3.5" />
          )}
          {isExporting ? 'Exporting…' : 'Share ↗'}
        </motion.button>
      ) : null}
    </div>
  );
}

export default function GraphCanvas(props: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

function getNodeColor(type: string): string {
  switch (type) {
    case 'pandas':       return '#3b82f6';
    case 'pytorch':      return '#f97316';
    case 'input':        return '#22c55e';
    case 'output':       return '#ef4444';
    case 'intermediate': return '#a855f7';
    default:             return '#888888';
  }
}
