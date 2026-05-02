import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { EXAMPLES, CATEGORY_COLORS, CATEGORY_LABELS, type Example } from '@/data/examples';

interface ExamplesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (example: Example) => void;
  isTyping: boolean;
}

export default function ExamplesPanel({ isOpen, onClose, onSelect, isTyping }: ExamplesPanelProps) {
  return (
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
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute top-[65px] left-0 right-0 z-40 mx-3 rounded-xl border border-white/10 bg-[#13161e]/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <div>
                <p className="text-xs font-semibold text-white/90 tracking-wide">Try an example to see the magic</p>
                <p className="text-[10px] text-white/35 mt-0.5">Click any card — it types itself in and visualizes automatically</p>
              </div>
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Grid */}
            <div className="p-3 grid grid-cols-2 gap-2">
              {EXAMPLES.map((example, i) => {
                const color = CATEGORY_COLORS[example.category];
                const label = CATEGORY_LABELS[example.category];
                return (
                  <motion.button
                    key={example.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.18 }}
                    onClick={() => !isTyping && onSelect(example)}
                    disabled={isTyping}
                    className="relative group text-left p-3 rounded-lg border border-white/6 bg-white/3 hover:bg-white/6 hover:border-white/12 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  >
                    {/* Subtle color glow on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg"
                      style={{ background: `radial-gradient(ellipse at top left, ${color}18 0%, transparent 60%)` }}
                    />

                    <div className="relative flex flex-col gap-2">
                      {/* Title */}
                      <span className="text-xs font-semibold text-white/85 leading-snug">{example.title}</span>

                      {/* Badges row */}
                      <div className="flex items-center gap-1.5">
                        {/* Category tag */}
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ color, background: `${color}22` }}
                        >
                          {label}
                        </span>
                        {/* Step count */}
                        <span className="text-[9px] font-medium text-white/30 px-1.5 py-0.5 rounded bg-white/5 border border-white/8">
                          {example.steps} steps
                        </span>
                      </div>
                    </div>

                    {/* Animated left border accent */}
                    <div
                      className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: `linear-gradient(to bottom, ${color}, ${color}60)` }}
                    />
                  </motion.button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2.5 border-t border-white/6 flex items-center gap-2">
              <div className="flex items-center gap-3 text-[10px] text-white/25">
                {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                  <span key={cat} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
                    {CATEGORY_LABELS[cat as Example['category']]}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
