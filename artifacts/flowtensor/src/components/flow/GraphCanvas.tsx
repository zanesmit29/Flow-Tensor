import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
import { AnimatePresence, motion } from 'framer-motion';
import { Zap, Share2, Loader2, Footprints, ChevronLeft, ChevronRight, Home as HomeIcon } from 'lucide-react';
import CustomNode from './CustomNode';
import StepControls, { type PlaybackSpeed } from './StepControls';
import Level1Flow from './Level1Flow';
import Level2View from './Level2View';
import type {
  ParseResponse,
  FlowNode as ApiFlowNode,
  FlowEdge as ApiFlowEdge,
  FlowBlock,
  BlockChild,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

const nodeTypes = { custom: CustomNode };

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;

interface GraphCanvasProps {
  data?: ParseResponse;
  isPending: boolean;
}

type Level = 1 | 2 | 3;

interface NavState {
  level: Level;
  blockId?: string;
  childId?: string;
}

export default function GraphCanvas(props: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

function GraphCanvasInner({ data, isPending }: GraphCanvasProps) {
  const blocks: FlowBlock[] = data?.blocks ?? [];
  const hasBlocks = blocks.length > 0;

  const [nav, setNav] = useState<NavState>({ level: 1 });

  // Reset nav whenever a new parse arrives
  useEffect(() => {
    if (!data) return;
    if (hasBlocks) {
      // If only one block, drill straight to its body for a cleaner default view
      if (blocks.length === 1 && blocks[0].children.length === 1) {
        setNav({ level: 3, blockId: blocks[0].id, childId: blocks[0].children[0].id });
      } else {
        setNav({ level: 1 });
      }
    } else {
      setNav({ level: 3 });
    }
  }, [data, hasBlocks, blocks]);

  const selectedBlock = useMemo(
    () => blocks.find((b) => b.id === nav.blockId) ?? null,
    [blocks, nav.blockId],
  );
  const selectedChild = useMemo<BlockChild | null>(() => {
    if (!selectedBlock || !nav.childId) return null;
    return selectedBlock.children.find((c) => c.id === nav.childId) ?? null;
  }, [selectedBlock, nav.childId]);

  const handleExpand = useCallback(
    (blockId: string) => {
      const b = blocks.find((x) => x.id === blockId);
      if (!b) return;
      // If only one child, skip Level 2 and go straight to Level 3
      if (b.children.length === 1) {
        setNav({ level: 3, blockId, childId: b.children[0].id });
      } else {
        setNav({ level: 2, blockId });
      }
    },
    [blocks],
  );

  const handleOpenChild = useCallback((childId: string) => {
    setNav((n) => ({ level: 3, blockId: n.blockId, childId }));
  }, []);

  const handleBack = useCallback(() => {
    setNav((n) => {
      if (n.level === 3) {
        const block = blocks.find((b) => b.id === n.blockId);
        if (!hasBlocks) return n;
        if (block && block.children.length > 1) {
          return { level: 2, blockId: n.blockId };
        }
        return { level: 1 };
      }
      if (n.level === 2) return { level: 1 };
      return n;
    });
  }, [blocks, hasBlocks]);

  const handleHome = useCallback(() => {
    if (hasBlocks) setNav({ level: 1 });
  }, [hasBlocks]);

  // Empty state
  if (!data && !isPending) {
    return <EmptyState />;
  }
  if (!data?.nodes?.length && !hasBlocks && !isPending) {
    return <EmptyState />;
  }

  // Resolve scope-of-graph for Level 3
  const level3Nodes: ApiFlowNode[] = selectedChild?.nodes ?? data?.nodes ?? [];
  const level3Edges: ApiFlowEdge[] = selectedChild?.edges ?? data?.edges ?? [];

  return (
    <div className="w-full h-full relative bg-[#0f1117] overflow-hidden">
      {/* Breadcrumbs + back */}
      {hasBlocks && (
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
          {nav.level > 1 && (
            <motion.button
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBack}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/15 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md shadow-lg"
              data-testid="btn-back"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back
            </motion.button>
          )}
          <Breadcrumbs
            level={nav.level}
            block={selectedBlock}
            child={selectedChild}
            onHome={handleHome}
            onBlock={() =>
              selectedBlock && selectedBlock.children.length > 1
                ? setNav({ level: 2, blockId: selectedBlock.id })
                : handleHome()
            }
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {nav.level === 1 && hasBlocks && (
          <motion.div key="l1" className="absolute inset-0">
            <Level1Flow blocks={blocks} onExpand={handleExpand} />
          </motion.div>
        )}
        {nav.level === 2 && hasBlocks && selectedBlock && (
          <motion.div key={`l2-${selectedBlock.id}`} className="absolute inset-0">
            <Level2View block={selectedBlock} onOpenChild={handleOpenChild} />
          </motion.div>
        )}
        {nav.level === 3 && (
          <motion.div
            key={`l3-${nav.childId ?? 'flat'}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <Level3Flow
              nodes={level3Nodes}
              edges={level3Edges}
              framework={data?.framework}
              scopeLabel={selectedChild ? `${selectedBlock?.name ?? ''}.${selectedChild.name}` : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Breadcrumbs
// ─────────────────────────────────────────────────────────────────────

function Breadcrumbs({
  level,
  block,
  child,
  onHome,
  onBlock,
}: {
  level: Level;
  block: FlowBlock | null;
  child: BlockChild | null;
  onHome: () => void;
  onBlock: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-[#1a1d24]/80 backdrop-blur-md shadow-lg text-xs font-mono"
      data-testid="breadcrumbs"
    >
      <button
        type="button"
        onClick={onHome}
        className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
      >
        <HomeIcon className="w-3 h-3" />
        FlowTensor
      </button>
      {block && (
        <>
          <ChevronRight className="w-3 h-3 text-white/30" />
          <button
            type="button"
            onClick={onBlock}
            className={`hover:text-white transition-colors ${level === 2 ? 'text-white' : 'text-white/70'}`}
          >
            {block.name}
          </button>
        </>
      )}
      {level === 3 && child && (
        <>
          <ChevronRight className="w-3 h-3 text-white/30" />
          <span className="text-white">
            {child.name === 'body' ? `${block?.name ?? ''}()` : `${child.name}()`}
          </span>
        </>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────

function EmptyState() {
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

// ─────────────────────────────────────────────────────────────────────
// Level 3 — flat node graph (the original visualization, scoped)
// ─────────────────────────────────────────────────────────────────────

interface Level3FlowProps {
  nodes: ApiFlowNode[];
  edges: ApiFlowEdge[];
  framework?: string;
  scopeLabel?: string;
}

function Level3Flow({ nodes: apiNodes, edges: apiEdges, framework, scopeLabel }: Level3FlowProps) {
  return (
    <ReactFlowProvider>
      <Level3FlowInner
        nodes={apiNodes}
        edges={apiEdges}
        framework={framework}
        scopeLabel={scopeLabel}
      />
    </ReactFlowProvider>
  );
}

function Level3FlowInner({ nodes: apiNodes, edges: apiEdges, framework, scopeLabel }: Level3FlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isExporting, setIsExporting] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { getNodes, fitView } = useReactFlow();
  const { toast } = useToast();

  const [stepMode, setStepMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const totalSteps = apiNodes.length;

  useEffect(() => {
    if (!apiNodes.length) {
      setNodes([]);
      setEdges([]);
      return undefined;
    }
    const newNodes = apiNodes.map((node, index) => ({
      id: node.id,
      type: 'custom',
      position: { x: node.position_x || 0, y: node.position_y || index * 100 },
      data: { ...node, index },
    }));

    const newEdges = apiEdges.map((edge) => {
      const sourceNode = apiNodes.find((n) => n.id === edge.source);
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

    const t = setTimeout(() => {
      fitView({ padding: 0.2, duration: 600, maxZoom: 1.2 });
    }, 120);
    return () => clearTimeout(t);
  }, [apiNodes, apiEdges, setNodes, setEdges, fitView]);

  useEffect(() => {
    setStepMode(false);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [apiNodes]);

  const activeNodeId =
    stepMode && apiNodes.length > 0
      ? apiNodes[Math.min(currentStep, apiNodes.length - 1)]?.id ?? null
      : null;

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isActive: stepMode && n.id === activeNodeId,
          isDimmed: stepMode && n.id !== activeNodeId,
        },
      })),
    );
  }, [stepMode, activeNodeId, setNodes]);

  useEffect(() => {
    if (!stepMode || !isPlaying || totalSteps === 0) return undefined;
    if (currentStep >= totalSteps - 1) {
      setIsPlaying(false);
      return undefined;
    }
    const interval = 2000 / speed;
    const t = setTimeout(() => setCurrentStep((s) => s + 1), interval);
    return () => clearTimeout(t);
  }, [stepMode, isPlaying, currentStep, speed, totalSteps]);

  const handleEnterStepMode = useCallback(() => {
    if (totalSteps === 0) return;
    setStepMode(true);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [totalSteps]);

  const handleExitStepMode = useCallback(() => {
    setStepMode(false);
    setIsPlaying(false);
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const handlePrev = useCallback(() => setCurrentStep((s) => Math.max(0, s - 1)), []);
  const handleNext = useCallback(
    () => setCurrentStep((s) => Math.min(totalSteps - 1, s + 1)),
    [totalSteps],
  );
  const handlePlayToggle = useCallback(() => {
    setIsPlaying((p) => {
      if (!p && currentStep >= totalSteps - 1) setCurrentStep(0);
      return !p;
    });
  }, [currentStep, totalSteps]);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      fitView({ padding: 0.15 });
      await new Promise((r) => setTimeout(r, 350));

      const wrapper = wrapperRef.current;
      if (wrapper) wrapper.classList.add('rf-exporting');
      await new Promise((r) => setTimeout(r, 60));

      const rfNodes = getNodes();

      const xs = rfNodes.flatMap((n) => [n.position.x, n.position.x + (n.measured?.width ?? 150)]);
      const ys = rfNodes.flatMap((n) => [n.position.y, n.position.y + (n.measured?.height ?? 60)]);
      const bounds = {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      };

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

      await toPng(viewport, options);
      const dataUrl = await toPng(viewport, options);

      const link = document.createElement('a');
      link.download = 'flowtensor-pipeline.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

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

  if (!apiNodes.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0f1117]">
        <p className="text-white/40 text-sm">No operations to display in this scope.</p>
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

      {framework && framework !== 'unknown' && (() => {
        const hasNumpy = framework.includes('numpy');
        const baseFw = framework.replace('+numpy', '').replace('numpy', '');
        let dotClass: string;
        if (hasNumpy && !baseFw) {
          dotClass = 'bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]';
        } else if (baseFw === 'pytorch') {
          dotClass = 'bg-[#f97316] shadow-[0_0_8px_#f97316]';
        } else if (baseFw === 'pandas') {
          dotClass = 'bg-[#3b82f6] shadow-[0_0_8px_#3b82f6]';
        } else {
          dotClass = 'bg-purple-500 shadow-[0_0_8px_#a855f7]';
        }
        const parts: string[] = [];
        if (baseFw === 'pandas') parts.push('Pandas');
        else if (baseFw === 'pytorch') parts.push('PyTorch');
        else if (baseFw === 'mixed') parts.push('Pandas', 'PyTorch');
        if (hasNumpy) parts.push('NumPy');
        const label = parts.length ? parts.join(' + ') : framework;
        return (
          <div className="absolute bottom-6 right-6 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-sm font-medium flex items-center gap-2 shadow-xl text-white">
            <div className={`w-2 h-2 rounded-full animate-pulse ${dotClass}`} />
            <span>{label} Detected</span>
            {scopeLabel && <span className="text-white/40 ml-1">· {scopeLabel}</span>}
          </div>
        );
      })()}

      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <AnimatePresence>
          {stepMode && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              data-testid="step-counter-pill"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-500/30 bg-blue-600/15 text-blue-200 backdrop-blur-md shadow-lg tabular-nums"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Step {Math.min(currentStep + 1, totalSteps)} of {totalSteps}
            </motion.div>
          )}
        </AnimatePresence>

        {!stepMode && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEnterStepMode}
            data-testid="btn-enter-step-mode"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-500/30 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-emerald-200 hover:from-emerald-600/35 hover:to-teal-600/35 hover:border-emerald-400/50 transition-all backdrop-blur-md shadow-lg"
          >
            <Footprints className="w-3.5 h-3.5" />
            Step Through ▶
          </motion.button>
        )}

        <motion.button
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-purple-500/30 bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-purple-200 hover:from-blue-600/35 hover:to-purple-600/35 hover:border-purple-400/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed backdrop-blur-md shadow-lg"
        >
          {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
          {isExporting ? 'Exporting…' : 'Share ↗'}
        </motion.button>
      </div>

      <AnimatePresence>
        {stepMode && totalSteps > 0 && (
          <StepControls
            currentStep={currentStep}
            totalSteps={totalSteps}
            isPlaying={isPlaying}
            speed={speed}
            onPrev={handlePrev}
            onNext={handleNext}
            onReset={handleReset}
            onPlayToggle={handlePlayToggle}
            onSpeedChange={setSpeed}
            onExit={handleExitStepMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function getNodeColor(type: string): string {
  switch (type) {
    case 'pandas':
      return '#3b82f6';
    case 'pytorch':
      return '#f97316';
    case 'input':
      return '#22c55e';
    case 'output':
      return '#ef4444';
    case 'intermediate':
      return '#a855f7';
    default:
      return '#888888';
  }
}
