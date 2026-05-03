import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
}

const CODE_LINES: { tokens: { text: string; cls?: string }[] }[] = [
  { tokens: [{ text: 'import', cls: 'text-purple-400' }, { text: ' pandas ' }, { text: 'as', cls: 'text-purple-400' }, { text: ' pd' }] },
  { tokens: [{ text: '' }] },
  { tokens: [{ text: 'df ' }, { text: '=', cls: 'text-pink-400' }, { text: ' pd.', cls: 'text-white/80' }, { text: 'read_csv', cls: 'text-blue-400' }, { text: '(', cls: 'text-white/60' }, { text: '"titanic.csv"', cls: 'text-emerald-300' }, { text: ')', cls: 'text-white/60' }] },
  { tokens: [{ text: 'df ' }, { text: '=', cls: 'text-pink-400' }, { text: ' df.', cls: 'text-white/80' }, { text: 'dropna', cls: 'text-blue-400' }, { text: '()', cls: 'text-white/60' }] },
  { tokens: [{ text: 'df ' }, { text: '=', cls: 'text-pink-400' }, { text: ' df.', cls: 'text-white/80' }, { text: 'fillna', cls: 'text-blue-400' }, { text: '(', cls: 'text-white/60' }, { text: '0', cls: 'text-amber-300' }, { text: ')', cls: 'text-white/60' }] },
  { tokens: [{ text: 'df ' }, { text: '=', cls: 'text-pink-400' }, { text: ' df.', cls: 'text-white/80' }, { text: 'reset_index', cls: 'text-blue-400' }, { text: '(', cls: 'text-white/60' }, { text: 'drop', cls: 'text-orange-300' }, { text: '=', cls: 'text-pink-400' }, { text: 'True', cls: 'text-purple-400' }, { text: ')', cls: 'text-white/60' }] },
  { tokens: [{ text: '' }] },
  { tokens: [{ text: '# Ready to model →', cls: 'text-white/30 italic' }] },
];

const NODES = [
  { id: 'a', label: 'read_csv()', sub: 'DataFrame', x: 8, y: 14 },
  { id: 'b', label: 'dropna()', sub: 'Clean', x: 56, y: 14 },
  { id: 'c', label: 'fillna(0)', sub: 'Impute', x: 8, y: 60 },
  { id: 'd', label: 'reset_index()', sub: 'Output', x: 56, y: 60 },
];

export default function Landing({ onGetStarted }: LandingProps) {
  const reduce = useReducedMotion();

  const fadeUp = (delay: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3, delay } }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
        };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0f1117] text-white">
      {/* Atmospheric gradients */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 60%), radial-gradient(circle at 85% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 60%)',
        }}
      />

      {/* Top Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            FlowTensor
          </span>
        </div>
        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white/50 hover:text-white/90 transition-colors"
        >
          GitHub
        </a>
      </nav>

      {/* Hero */}
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-6 sm:pt-10 text-center">
        <motion.div {...fadeUp(0)}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/70 backdrop-blur-sm">
            <span className="text-blue-400">✦</span>
            Built for Data Scientists &amp; ML Engineers
          </span>
        </motion.div>

        <motion.h1
          {...fadeUp(0.1)}
          className="mt-7 font-bold tracking-tight leading-[1.05]"
          style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)' }}
        >
          <span className="block text-white">Understand your</span>
          <span
            className="block bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)' }}
          >
            code visually.
          </span>
        </motion.h1>

        <motion.p
          {...fadeUp(0.2)}
          className="mt-7 max-w-[520px] text-base sm:text-lg leading-relaxed text-white/60"
        >
          Paste any PyTorch, Pandas, or NumPy code and instantly see an interactive graph of how
          your data flows, transforms, and moves through every step.
        </motion.p>

        <motion.div {...fadeUp(0.3)} className="mt-10 flex flex-col items-center gap-3 w-full sm:w-auto">
          <motion.button
            onClick={onGetStarted}
            whileHover={reduce ? undefined : { scale: 1.03 }}
            whileTap={reduce ? undefined : { scale: 0.98 }}
            className="group relative inline-flex items-center justify-center gap-2 rounded-full px-10 py-4 text-base font-semibold text-white w-full sm:w-auto"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              boxShadow: '0 10px 40px -10px rgba(99, 102, 241, 0.6), 0 0 0 1px rgba(255,255,255,0.08) inset',
              transition: 'box-shadow 300ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                '0 18px 60px -10px rgba(139, 92, 246, 0.75), 0 0 0 1px rgba(255,255,255,0.12) inset';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                '0 10px 40px -10px rgba(99, 102, 241, 0.6), 0 0 0 1px rgba(255,255,255,0.08) inset';
            }}
          >
            Get Started — it's free
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
          <p className="text-xs text-white/40">No signup required · Works in your browser</p>
          <button
            type="button"
            onClick={() => {
              window.location.hash = 'app-github';
            }}
            className="text-xs text-white/40 hover:text-white/70 underline underline-offset-4 decoration-white/20 hover:decoration-white/50 transition-colors"
          >
            Or import directly from a GitHub repository →
          </button>
        </motion.div>

        {/* Preview Card */}
        <motion.div
          {...fadeUp(0.5)}
          className="hidden min-[480px]:block mt-16 w-full max-w-5xl"
        >
          <div
            className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0d13]/80 backdrop-blur-sm"
            style={{ boxShadow: '0 0 80px rgba(96, 165, 250, 0.12)' }}
          >
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-3">
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="ml-3 text-[11px] text-white/30 font-mono">flowtensor — preview</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Code panel */}
              <div className="border-b md:border-b-0 md:border-r border-white/[0.06] bg-[#0d1018] p-5 font-mono text-[13px] leading-[1.7] text-left">
                {CODE_LINES.map((line, i) => (
                  <div key={i} className="flex">
                    <span className="select-none w-6 mr-3 text-white/20 text-right">{i + 1}</span>
                    <span className="flex-1 text-white/85 whitespace-pre">
                      {line.tokens.map((t, j) => (
                        <span key={j} className={t.cls}>{t.text}</span>
                      ))}
                      {line.tokens.length === 1 && line.tokens[0].text === '' ? '\u00A0' : ''}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mini graph */}
              <div className="relative bg-[#0a0c12] p-5 min-h-[280px]">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" aria-hidden>
                  <defs>
                    <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.7" />
                    </linearGradient>
                  </defs>
                  {/* a -> b */}
                  <line x1="32%" y1="22%" x2="56%" y2="22%" stroke="url(#edgeGrad)" strokeWidth="1.5" strokeDasharray="5 5" className="dash-flow" />
                  {/* b -> c (diagonal) */}
                  <line x1="68%" y1="32%" x2="22%" y2="58%" stroke="url(#edgeGrad)" strokeWidth="1.5" strokeDasharray="5 5" className="dash-flow" />
                  {/* c -> d */}
                  <line x1="32%" y1="68%" x2="56%" y2="68%" stroke="url(#edgeGrad)" strokeWidth="1.5" strokeDasharray="5 5" className="dash-flow" />
                </svg>

                {NODES.map((n) => (
                  <div
                    key={n.id}
                    className="absolute rounded-lg border border-white/10 bg-[#11141c] px-3 py-2 shadow-lg"
                    style={{ left: `${n.x}%`, top: `${n.y}%`, width: '36%' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                      <span className="text-[11px] font-mono text-white/90 truncate">{n.label}</span>
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-white/40">{n.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dashFlow {
          to { stroke-dashoffset: -20; }
        }
        .dash-flow {
          animation: dashFlow 1.2s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .dash-flow { animation: none; }
        }
      `}} />
    </div>
  );
}
