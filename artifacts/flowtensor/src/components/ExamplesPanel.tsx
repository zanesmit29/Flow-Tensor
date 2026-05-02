import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';
import {
  EXAMPLES_BY_GROUP,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  COMPLEXITY_CONFIG,
  type Example,
  type ExampleGroup,
} from '@/data/examples';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ExamplesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (example: Example) => void;
  isTyping: boolean;
}

const GROUP_ORDER: ExampleGroup[] = ['PyTorch', 'Pandas / Data Prep'];

const GROUP_ACCENT: Record<ExampleGroup, string> = {
  PyTorch: '#f97316',
  'Pandas / Data Prep': '#3b82f6',
};

export default function ExamplesPanel({
  isOpen,
  onClose,
  onSelect,
  isTyping,
}: ExamplesPanelProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px]"
              onClick={onClose}
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute top-[65px] left-0 right-0 z-40 mx-3 rounded-xl border border-white/10 bg-[#111318]/97 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                <div>
                  <p className="text-xs font-semibold text-white/90 tracking-wide">
                    Try an example to see the magic ✨
                  </p>
                  <p className="text-[10px] text-white/35 mt-0.5">
                    Clicks types itself in and auto-visualizes
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="max-h-[calc(100vh-140px)] overflow-y-auto">
                {GROUP_ORDER.map((group) => {
                  const items = EXAMPLES_BY_GROUP[group];
                  const accent = GROUP_ACCENT[group];
                  return (
                    <div key={group} className="p-3 pb-1">
                      {/* Group heading */}
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: accent }}
                        />
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: accent }}
                        >
                          {group}
                        </span>
                      </div>

                      {/* Cards grid */}
                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        {items.map((example, i) => (
                          <ExampleCard
                            key={example.id}
                            example={example}
                            index={i}
                            isTyping={isTyping}
                            onSelect={onSelect}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer legend */}
              <div className="px-4 py-2 border-t border-white/6 flex items-center gap-4">
                {Object.entries(COMPLEXITY_CONFIG).map(([key, cfg]) => (
                  <span key={key} className="flex items-center gap-1 text-[9px] text-white/30">
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ background: cfg.color }}
                    />
                    {cfg.label}
                  </span>
                ))}
                <span className="ml-auto flex items-center gap-2 text-[9px] text-white/20">
                  {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                    <span key={cat} className="flex items-center gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ background: color }}
                      />
                      {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
                    </span>
                  ))}
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}

function ExampleCard({
  example,
  index,
  isTyping,
  onSelect,
}: {
  example: Example;
  index: number;
  isTyping: boolean;
  onSelect: (e: Example) => void;
}) {
  const color = CATEGORY_COLORS[example.category];
  const complexity = example.complexity ? COMPLEXITY_CONFIG[example.complexity] : null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.15 }}
      onClick={() => !isTyping && onSelect(example)}
      disabled={isTyping}
      className={`relative group text-left p-3 rounded-lg border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${
        example.featured
          ? 'border-blue-500/30 bg-blue-600/8 hover:bg-blue-600/14 hover:border-blue-500/50'
          : 'border-white/6 bg-white/3 hover:bg-white/6 hover:border-white/12'
      }`}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg"
        style={{
          background: `radial-gradient(ellipse at top left, ${color}15 0%, transparent 65%)`,
        }}
      />

      {/* Featured star */}
      {example.featured && (
        <div className="absolute top-2 right-2 text-[9px] text-blue-400/70 font-semibold tracking-wide">
          Featured
        </div>
      )}

      <div className="relative flex flex-col gap-2">
        {/* Title row */}
        <div className="flex items-start gap-1.5 pr-10">
          <span className="text-[11px] font-semibold text-white/85 leading-snug">
            {example.title}
          </span>
          {/* Advanced tooltip */}
          {example.whyComplex && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="mt-0.5 shrink-0 text-red-400/60 hover:text-red-400 transition-colors cursor-help">
                  <Info className="w-3 h-3" />
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="max-w-[220px] text-[11px] leading-relaxed bg-[#1a1d28] border-white/10 text-white/80"
              >
                <p className="font-semibold text-red-400 mb-1">Why is this complex?</p>
                <p>{example.whyComplex}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Category tag */}
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ color, background: `${color}22` }}
          >
            {CATEGORY_LABELS[example.category]}
          </span>

          {/* Complexity badge */}
          {complexity && (
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
              style={{ color: complexity.color, background: complexity.bg }}
            >
              {complexity.label}
            </span>
          )}

          {/* Step count */}
          <span className="text-[9px] font-medium text-white/30 px-1.5 py-0.5 rounded bg-white/5 border border-white/8">
            {example.steps} steps
          </span>
        </div>
      </div>

      {/* Left edge accent */}
      <div
        className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: `linear-gradient(to bottom, ${color}, ${color}50)` }}
      />
    </motion.button>
  );
}
