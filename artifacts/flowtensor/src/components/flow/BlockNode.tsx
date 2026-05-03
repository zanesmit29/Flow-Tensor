import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { ChevronRight, Box, FunctionSquare, Layers } from "lucide-react";
import type { FlowBlock } from "@workspace/api-client-react";

export const BLOCK_W = 260;
export const BLOCK_H = 150;

export const BLOCK_COLORS: Record<string, string> = {
  blue: "#3b82f6",
  purple: "#8b5cf6",
  green: "#22c55e",
  red: "#ef4444",
};

interface BlockNodeData {
  block: FlowBlock;
  onExpand: (id: string) => void;
}

function BlockNodeComponent({ data, isConnectable }: { data: BlockNodeData; isConnectable: boolean }) {
  const { block, onExpand } = data;
  const color = BLOCK_COLORS[block.color] ?? BLOCK_COLORS.blue;

  const TypeIcon =
    block.type === "class" ? Box : block.type === "function" ? FunctionSquare : Layers;
  const typeBadge =
    block.type === "class" ? "CLASS" : block.type === "function" ? "FUNCTION" : "MODULE";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -2 }}
      onDoubleClick={() => onExpand(block.id)}
      style={{
        width: BLOCK_W,
        minHeight: BLOCK_H,
        borderColor: color,
        boxShadow: `0 0 28px ${color}33, inset 0 0 1px ${color}66`,
      }}
      className="relative cursor-pointer rounded-xl border-2 bg-[#161922]/95 backdrop-blur-md p-4 flex flex-col gap-2 group"
      data-testid={`block-${block.id}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-2.5 !h-2.5 !border-2 !bg-background"
        style={{ borderColor: color }}
      />

      {/* Type badge */}
      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] px-2 py-0.5 rounded-md"
          style={{ color, backgroundColor: `${color}1a`, border: `1px solid ${color}55` }}
        >
          <TypeIcon className="w-3 h-3" />
          {typeBadge}
        </span>
        {block.bases && block.bases.length > 0 && (
          <span className="text-[10px] text-white/40 font-mono truncate max-w-[120px]">
            extends {block.bases.join(", ")}
          </span>
        )}
      </div>

      {/* Name */}
      <div className="font-bold text-lg text-white tracking-tight leading-tight truncate">
        {block.name}
      </div>

      {/* Summary */}
      <div className="text-xs text-white/55 leading-snug font-mono">
        {block.summary}
      </div>

      {/* Footer: op count + expand */}
      <div className="mt-auto flex items-center justify-between pt-2">
        <span
          className="text-[10px] font-semibold px-2 py-1 rounded-md text-white/70 bg-white/5 border border-white/10"
          data-testid={`block-${block.id}-opcount`}
        >
          {block.op_count} ops inside
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExpand(block.id);
          }}
          className="flex items-center gap-1 text-[11px] font-semibold text-white/60 group-hover:text-white transition-colors"
          data-testid={`block-${block.id}-expand`}
        >
          Expand
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!w-2.5 !h-2.5 !border-2 !bg-background"
        style={{ borderColor: color }}
      />
    </motion.div>
  );
}

export default memo(BlockNodeComponent);
