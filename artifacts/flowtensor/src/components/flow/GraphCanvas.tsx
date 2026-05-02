import React, { useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Edge,
  Node as FlowFlowNode,
  MarkerType,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';
import type { ParseResponse, FlowNode as ApiFlowNode } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const nodeTypes = {
  custom: CustomNode,
};

interface GraphCanvasProps {
  data?: ParseResponse;
  isPending: boolean;
}

function GraphCanvasInner({ data, isPending }: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (data?.nodes && data?.edges) {
      const newNodes = data.nodes.map((node: ApiFlowNode, index: number) => ({
        id: node.id,
        type: 'custom',
        position: { x: node.position_x || 0, y: node.position_y || index * 100 },
        data: {
          ...node,
          index,
        },
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
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: color,
          },
        };
      });

      setNodes(newNodes);
      setEdges(newEdges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [data, setNodes, setEdges]);

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
    <div className="w-full h-full relative bg-[#0f1117]">
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

      {data?.framework && data.framework !== 'unknown' && (
        <div className="absolute bottom-6 right-6 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-sm font-medium flex items-center gap-2 shadow-xl text-white">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            data.framework === 'pytorch' ? 'bg-[#f97316] shadow-[0_0_8px_#f97316]' :
            data.framework === 'pandas' ? 'bg-[#3b82f6] shadow-[0_0_8px_#3b82f6]' :
            'bg-purple-500 shadow-[0_0_8px_#a855f7]'
          }`} />
          <span className="capitalize">{data.framework} Detected</span>
        </div>
      )}
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
    case 'pandas': return '#3b82f6';
    case 'pytorch': return '#f97316';
    case 'input': return '#22c55e';
    case 'output': return '#ef4444';
    case 'intermediate': return '#a855f7';
    default: return '#888888';
  }
}
