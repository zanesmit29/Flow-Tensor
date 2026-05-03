import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FlowNodeType } from "@workspace/api-client-react";
import { getShapeMeta } from "@/lib/shapeMap";
import { SHAPE_COMPONENTS } from "./shapes/Shapes";
import { useAISettings } from "@/contexts/AISettingsContext";

interface CustomNodeData {
  type: FlowNodeType;
  label: string;
  description: string;
  input_shape: string | null;
  output_shape: string | null;
  index: number;
  // Step-through mode flags (injected by GraphCanvas)
  isActive?: boolean;
  isDimmed?: boolean;
}

const NODE_W = 200;
const NODE_H = 92;

function CustomNodeComponent({ data, isConnectable }: { data: CustomNodeData; isConnectable: boolean }) {
  const meta = getShapeMeta(data.label, data.type);
  const Shape = SHAPE_COMPONENTS[meta.category];
  const { hasKey } = useAISettings();

  const isActive = !!data.isActive;
  const isDimmed = !!data.isDimmed;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: isDimmed ? 0.3 : 1,
            y: 0,
            scale: isActive ? 1.05 : 1,
          }}
          transition={
            isActive
              ? { type: "spring", stiffness: 240, damping: 18 }
              : { duration: 0.4, delay: (data.index || 0) * 0.08, ease: "easeOut" }
          }
          className="relative cursor-grab active:cursor-grabbing group"
          style={{ width: NODE_W, height: NODE_H }}
          data-active={isActive ? "true" : "false"}
          data-dimmed={isDimmed ? "true" : "false"}
          data-testid={`flow-node-${data.index ?? 0}`}
        >
          {/* Pulsing glow ring shown only when this node is the active step */}
          {isActive && (
            <motion.div
              aria-hidden
              className="absolute -inset-2 rounded-2xl pointer-events-none"
              style={{
                boxShadow: `0 0 20px ${meta.color}, 0 0 44px ${meta.color}66, inset 0 0 18px ${meta.color}33`,
                border: `1.5px solid ${meta.color}`,
              }}
              animate={{ opacity: [0.45, 1, 0.45], scale: [1, 1.04, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {data.type !== "input" && (
            <Handle
              type="target"
              position={Position.Top}
              isConnectable={isConnectable}
              className="!w-2.5 !h-2.5 !border-2 !bg-background"
              style={{ borderColor: meta.color }}
            />
          )}

          <Shape width={NODE_W} height={NODE_H} color={meta.color} />

          {/* AI badge — shown on hover. Muted when no key is configured. */}
          <span
            aria-hidden
            className="absolute top-1.5 right-2 text-[12px] leading-none font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none"
            style={{ color: hasKey ? meta.color : "rgba(255,255,255,0.3)" }}
            data-testid={`ai-badge-${data.index ?? 0}`}
          >
            ✦
          </span>

          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.14em] leading-none mb-1.5"
              style={{ color: meta.color, opacity: 0.85 }}
            >
              {meta.label}
            </span>
            <div className="font-mono font-bold text-[13px] tracking-tight text-foreground truncate max-w-full leading-tight">
              {data.label}
            </div>
          </div>

          {data.type !== "output" && (
            <Handle
              type="source"
              position={Position.Bottom}
              isConnectable={isConnectable}
              className="!w-2.5 !h-2.5 !border-2 !bg-background"
              style={{ borderColor: meta.color }}
            />
          )}
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[280px] border-white/10 shadow-2xl bg-card p-3 text-sm font-sans">
        <p className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: meta.color }}>
          {meta.label}
        </p>
        <p>{data.description}</p>
        {(data.input_shape || data.output_shape) && (
          <p className="font-mono text-[11px] text-muted-foreground mt-2 pt-2 border-t border-white/10">
            {data.input_shape ?? "?"} <span className="text-white/30 mx-1">→</span> {data.output_shape ?? "?"}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export default memo(CustomNodeComponent);
