import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  BackgroundVariant,
  type Edge,
  type Node as FlowFlowNode,
} from "@xyflow/react";
import { motion } from "framer-motion";
import type { FlowBlock } from "@workspace/api-client-react";
import BlockNode, { BLOCK_COLORS, BLOCK_H, BLOCK_W } from "./BlockNode";

const nodeTypes = { block: BlockNode };

interface Level1FlowProps {
  blocks: FlowBlock[];
  onExpand: (blockId: string) => void;
}

function Level1FlowInner({ blocks, onExpand }: Level1FlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();

  const computed = useMemo(() => {
    const flowNodes: FlowFlowNode[] = blocks.map((b) => ({
      id: b.id,
      type: "block",
      position: { x: b.position_x ?? 0, y: b.position_y ?? 0 },
      data: { block: b, onExpand },
      width: BLOCK_W,
      height: BLOCK_H,
    }));

    const flowEdges: Edge[] = [];
    for (const b of blocks) {
      for (const c of b.connections ?? []) {
        const color = BLOCK_COLORS[b.color] ?? "#888";
        const isInherits = c.type === "inherits";
        const isPasses = c.type === "passes_data";
        flowEdges.push({
          id: `e-${b.id}-${c.to}-${c.type}`,
          source: b.id,
          target: c.to,
          label: c.label,
          animated: !isInherits,
          style: {
            stroke: color,
            strokeWidth: 2,
            strokeDasharray: isInherits ? "2 4" : isPasses ? "6 4" : undefined,
          },
          labelStyle: { fill: "#cbd5e1", fontSize: 11, fontWeight: 600 },
          labelBgStyle: { fill: "#0f1117", fillOpacity: 0.85 },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 4,
          markerEnd: {
            type: isInherits ? MarkerType.Arrow : MarkerType.ArrowClosed,
            color,
          },
        });
      }
    }
    return { flowNodes, flowEdges };
  }, [blocks, onExpand]);

  useEffect(() => {
    setNodes(computed.flowNodes);
    setEdges(computed.flowEdges);
    const t = setTimeout(() => fitView({ padding: 0.25, duration: 500, maxZoom: 1.1 }), 80);
    return () => clearTimeout(t);
  }, [computed, setNodes, setEdges, fitView]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full h-full"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={2}
        className="bg-transparent"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.05)" />
        <Controls className="fill-white !bg-[#1a1d24] !border-white/10 !shadow-2xl" />
      </ReactFlow>
    </motion.div>
  );
}

export default function Level1Flow(props: Level1FlowProps) {
  return (
    <ReactFlowProvider>
      <Level1FlowInner {...props} />
    </ReactFlowProvider>
  );
}
