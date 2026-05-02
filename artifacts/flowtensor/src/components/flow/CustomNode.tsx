import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FlowNodeType } from "@workspace/api-client-react";

interface CustomNodeData {
  type: FlowNodeType;
  label: string;
  description: string;
  input_shape: string | null;
  output_shape: string | null;
  index: number;
}

const colorMap: Record<FlowNodeType, string> = {
  pandas: "border-[#3b82f6] shadow-[#3b82f6]/20",
  pytorch: "border-[#f97316] shadow-[#f97316]/20",
  intermediate: "border-[#a855f7] shadow-[#a855f7]/20",
  input: "border-[#22c55e] shadow-[#22c55e]/20",
  output: "border-[#ef4444] shadow-[#ef4444]/20",
};

const textMap: Record<FlowNodeType, string> = {
  pandas: "text-[#3b82f6]",
  pytorch: "text-[#f97316]",
  intermediate: "text-[#a855f7]",
  input: "text-[#22c55e]",
  output: "text-[#ef4444]",
};

function CustomNodeComponent({ data, isConnectable }: { data: CustomNodeData; isConnectable: boolean }) {
  const hasShape = data.input_shape || data.output_shape;
  const shapeText = `${data.input_shape || "?"} → ${data.output_shape || "?"}`;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: (data.index || 0) * 0.15, ease: "easeOut" }}
          className={`relative min-w-[160px] group cursor-grab active:cursor-grabbing rounded-xl border bg-card/90 backdrop-blur-xl p-4 shadow-xl flex flex-col gap-2 items-center text-center transition-all hover:shadow-2xl ${colorMap[data.type]}`}
        >
          {data.type !== "input" && (
            <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-muted-foreground w-3 h-3 border-2" />
          )}

          <div className="flex flex-col items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-black/40 ${textMap[data.type]}`}>
              {data.type}
            </span>
            <div className="font-mono font-bold text-sm tracking-tight text-foreground">{data.label}</div>
            
            {hasShape && (
              <Badge variant="outline" className="mt-1 w-fit bg-black/30 border-white/5 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                {data.input_shape && <span>{data.input_shape}</span>}
                {data.input_shape && data.output_shape && <span className="text-white/30 mx-1">→</span>}
                {data.output_shape && <span className="text-white">{data.output_shape}</span>}
              </Badge>
            )}
          </div>

          {data.type !== "output" && (
            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-muted-foreground w-3 h-3 border-2" />
          )}
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[250px] border-white/10 shadow-2xl bg-card p-3 text-sm font-sans">
        <p>{data.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default memo(CustomNodeComponent);
