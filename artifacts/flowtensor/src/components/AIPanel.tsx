import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, RefreshCw, Settings as SettingsIcon, AlertTriangle } from 'lucide-react';
import { explainNode, type FlowNode } from '@workspace/api-client-react';
import { useAISettings } from '@/contexts/AISettingsContext';

export interface AINodeContext {
  node: FlowNode;
  surroundingContext: string;
  library?: string;
}

interface AIPanelProps {
  context: AINodeContext | null;
  onClose: () => void;
  onOpenSettings: () => void;
}

type Level = 'beginner' | 'intermediate' | 'pro';

interface Explanation {
  source: 'ai' | 'static';
  what?: string | null;
  impact?: string | null;
  tip?: string | null;
  risk?: string | null;
  cached?: boolean;
}

export default function AIPanel({ context, onClose, onOpenSettings }: AIPanelProps) {
  const { hasKey, refreshStatus } = useAISettings();
  const [level, setLevel] = useState<Level>('intermediate');
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!context) return;
    let cancelled = false;
    setLoading(true);
    setExplanation(null);

    const node = context.node;
    explainNode({
      operation: node.label.replace(/\(.*\)/, '').trim() || node.label,
      parameters: null,
      shape_before: node.input_shape ?? null,
      shape_after: node.output_shape ?? null,
      variable_name: null,
      library: context.library ?? null,
      surrounding_context: context.surroundingContext,
      level,
    })
      .then((res) => {
        if (cancelled) return;
        setExplanation(res as Explanation);
        refreshStatus();
      })
      .catch(() => {
        if (cancelled) return;
        setExplanation({ source: 'static' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, level, reload]);

  return (
    <AnimatePresence>
      {context && (
        <motion.aside
          key="ai-panel"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="absolute top-0 right-0 h-full w-[340px] z-40 bg-[#13161d]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col"
          data-testid="ai-panel"
        >
          <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
              <Sparkles className="w-4 h-4 text-blue-400" />
              AI Insight
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="px-4 py-3 border-b border-white/5">
            <div className="font-mono text-sm text-white">{context.node.label}</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">
              {context.node.type}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm">
            {loading && <PanelSkeleton />}

            {!loading && explanation?.source === 'ai' && (
              <>
                {explanation.what && (
                  <Section label="What" body={explanation.what} />
                )}
                {explanation.impact && (
                  <Section label="Impact" body={explanation.impact} />
                )}
                {explanation.tip && (
                  <Section label="Tip" body={explanation.tip} />
                )}
                {explanation.risk && (
                  <Section
                    label="Risk"
                    body={explanation.risk}
                    icon={<AlertTriangle className="w-3 h-3 text-amber-400" />}
                  />
                )}
              </>
            )}

            {!loading && explanation?.source === 'static' && (
              <div className="space-y-4">
                <p className="text-white/70 leading-relaxed">{context.node.description}</p>
                {(context.node.input_shape || context.node.output_shape) && (
                  <p className="font-mono text-[12px] text-white/40 pt-3 border-t border-white/5">
                    {context.node.input_shape ?? '?'} <span className="text-white/25 mx-1">→</span>{' '}
                    {context.node.output_shape ?? '?'}
                  </p>
                )}
                {!hasKey && (
                  <div className="mt-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-blue-300 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      Unlock AI explanations
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Add a free Groq API key in Settings to get context-aware insights for every node.
                    </p>
                    <button
                      type="button"
                      onClick={onOpenSettings}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10"
                      data-testid="btn-open-settings-from-panel"
                    >
                      <SettingsIcon className="w-3 h-3" />
                      Open Settings
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <footer className="border-t border-white/10 p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              {(['beginner', 'intermediate', 'pro'] as const).map((lv) => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => setLevel(lv)}
                  className={`flex-1 text-[11px] font-semibold capitalize px-2 py-1.5 rounded-md border transition-colors ${
                    level === lv
                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-200'
                      : 'bg-white/5 border-white/10 text-white/55 hover:text-white hover:bg-white/10'
                  }`}
                  data-testid={`btn-level-${lv}`}
                >
                  {lv}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setReload((n) => n + 1)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-50"
              data-testid="btn-explain-differently"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Explain differently
            </button>
          </footer>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Section({
  label,
  body,
  icon,
}: {
  label: string;
  body: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <p className="text-white/85 leading-relaxed">{body}</p>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {[0, 1, 2, 3].map((i) => (
        <div key={i}>
          <div className="h-2.5 w-16 rounded bg-white/10 mb-2" />
          <div className="h-3 w-full rounded bg-white/8 mb-1.5" />
          <div className="h-3 w-4/5 rounded bg-white/8" />
        </div>
      ))}
    </div>
  );
}
