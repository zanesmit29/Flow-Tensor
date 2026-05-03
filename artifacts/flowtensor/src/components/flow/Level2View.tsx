import { motion } from "framer-motion";
import { ChevronRight, Box, FunctionSquare, Layers } from "lucide-react";
import type { FlowBlock, BlockChild } from "@workspace/api-client-react";
import { BLOCK_COLORS } from "./BlockNode";

interface Level2ViewProps {
  block: FlowBlock;
  onOpenChild: (childId: string) => void;
}

export default function Level2View({ block, onOpenChild }: Level2ViewProps) {
  const color = BLOCK_COLORS[block.color] ?? BLOCK_COLORS.blue;
  const TypeIcon =
    block.type === "class" ? Box : block.type === "function" ? FunctionSquare : Layers;
  const typeBadge =
    block.type === "class" ? "CLASS" : block.type === "function" ? "FUNCTION" : "MODULE";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full h-full flex items-center justify-center p-8 overflow-auto"
    >
      <div
        className="w-full max-w-3xl rounded-2xl border-2 bg-[#161922]/95 backdrop-blur-md shadow-2xl"
        style={{
          borderColor: color,
          boxShadow: `0 0 60px ${color}33, inset 0 0 1px ${color}66`,
        }}
        data-testid={`level2-${block.id}`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 rounded-md"
              style={{ color, backgroundColor: `${color}1a`, border: `1px solid ${color}55` }}
            >
              <TypeIcon className="w-3.5 h-3.5" />
              {typeBadge}
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">{block.name}</h2>
          </div>
          <span className="text-xs text-white/50 font-mono">{block.summary}</span>
        </div>

        {/* Children rows */}
        <div className="p-3">
          {block.children.map((child: BlockChild) => (
            <button
              key={child.id}
              type="button"
              onClick={() => onOpenChild(child.id)}
              disabled={child.op_count === 0}
              className="w-full group flex items-center justify-between gap-4 px-4 py-3.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left border border-transparent hover:border-white/10"
              data-testid={`child-${child.id}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                />
                <span className="font-mono font-semibold text-white truncate">
                  {child.name === "body" ? `${block.name}()` : `${child.name}()`}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] font-semibold px-2 py-1 rounded-md text-white/70 bg-white/5 border border-white/10">
                  {child.op_count} ops inside
                </span>
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </div>
            </button>
          ))}
        </div>

        {/* Attributes (for classes) */}
        {block.attributes && block.attributes.length > 0 && (
          <div className="px-6 py-4 border-t border-white/10">
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-semibold mb-2">
              Attributes
            </div>
            <div className="flex flex-wrap gap-1.5">
              {block.attributes.map((a) => (
                <span
                  key={a}
                  className="text-xs font-mono px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/70"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
