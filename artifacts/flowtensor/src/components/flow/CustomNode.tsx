import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FlowNodeType } from "@workspace/api-client-react";
import { getShapeMeta } from "@/lib/shapeMap";
import { SHAPE_COMPONENTS } from "./shapes/Shapes";

interface CustomNodeData {
  type: FlowNodeType;
  label: string;
  description: string;
  input_shape: string | null;
  output_shape: string | null;
  index: number;
}

const NODE_W = 200;
const NODE_H = 92;

function CustomNodeComponent({ data, isConnectable }: { data: CustomNodeData; isConnectable: boolean }) {
  const meta = getShapeMeta(data.label, data.type);
  const Shape = SHAPE_COMPONENTS[meta.category];

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: (data.index || 0) * 0.08, ease: "easeOut" }}
          className="relative cursor-grab active:cursor-grabbing group"
          style={{ width: NODE_W, height: NODE_H }}
        >
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
