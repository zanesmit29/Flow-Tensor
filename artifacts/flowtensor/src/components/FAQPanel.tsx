import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, Sparkles, Code2, MousePointerClick, Settings as SettingsIcon, KeyRound } from 'lucide-react';

interface FAQPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export default function FAQPanel({ isOpen, onClose, onOpenSettings }: FAQPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="faq-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            key="faq-panel"
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
                  How FlowTensor works ❓
                </p>
                <p className="text-[10px] text-white/35 mt-0.5">
                  A quick tour — paste, visualize, and explore
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[calc(100vh-140px)] overflow-y-auto p-4 space-y-4">
              {/* Step 1 */}
              <Step
                num={1}
                icon={<Code2 className="w-3.5 h-3.5" />}
                accent="#3b82f6"
                title="Paste your Python code"
              >
                Drop in any <span className="text-white/80">PyTorch</span>,{' '}
                <span className="text-white/80">Pandas</span>, or{' '}
                <span className="text-white/80">NumPy</span> snippet on the left.
                FlowTensor parses your code with a Python AST — nothing is executed,
                so it's safe to paste production code.
              </Step>

              {/* Step 2 — GitHub */}
              <Step
                num={2}
                icon={<Github className="w-3.5 h-3.5" />}
                accent="#a855f7"
                title="Or import directly from GitHub"
              >
                Switch to the{' '}
                <span className="text-white/80">🐙 Import from GitHub</span> tab and
                paste any public file URL, like{' '}
                <code className="px-1 py-0.5 rounded bg-white/5 text-[10px] text-white/70">
                  github.com/user/repo/blob/main/train.py
                </code>
                . FlowTensor fetches the raw file, drops it into the editor, and
                visualizes it instantly. Works with `.py` files only — no auth
                needed for public repos.
              </Step>

              {/* Step 3 */}
              <Step
                num={3}
                icon={<Sparkles className="w-3.5 h-3.5" />}
                accent="#f97316"
                title="Watch your code come alive"
              >
                Each operation becomes a glowing node. Edges show the data flow.
                Use <span className="text-white/80">Level 1 → Level 3</span> to
                drill from class structure down to individual ops inside each
                method.
              </Step>

              {/* Step 4 — Groq */}
              <Step
                num={4}
                icon={<KeyRound className="w-3.5 h-3.5" />}
                accent="#10b981"
                title="Plug in Groq for AI explanations"
              >
                <p className="mb-2">
                  For node-level AI insights, add a free Groq API key:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-white/55 text-[11px] mb-2">
                  <li>
                    Go to{' '}
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                    >
                      console.groq.com/keys
                    </a>{' '}
                    and create a key (starts with{' '}
                    <code className="px-1 rounded bg-white/5 text-[10px]">
                      gsk_
                    </code>
                    ).
                  </li>
                  <li>
                    Click the{' '}
                    <button
                      onClick={() => {
                        onClose();
                        onOpenSettings();
                      }}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/8 border border-white/10 text-white/85 hover:bg-white/12 transition-colors text-[10px] align-middle"
                    >
                      <SettingsIcon className="w-3 h-3" /> gear
                    </button>{' '}
                    icon (top-right) and paste it in.
                  </li>
                  <li>
                    The key is validated live and stored only for this session —
                    never written to disk or your browser's storage.
                  </li>
                </ol>
                <p className="text-white/40 text-[10px]">
                  Without a key, nodes still work — you just won't see the ✦ AI
                  panel.
                </p>
              </Step>

              {/* Step 5 */}
              <Step
                num={5}
                icon={<MousePointerClick className="w-3.5 h-3.5" />}
                accent="#ec4899"
                title="Click any node for the AI panel"
              >
                Look for the ✦ badge on hover. Click a node and a panel slides in
                from the right with a context-aware explanation: what it does, its
                impact, a pro tip, and a risk to watch for. Switch between{' '}
                <span className="text-white/80">Beginner</span>,{' '}
                <span className="text-white/80">Intermediate</span>, and{' '}
                <span className="text-white/80">Pro</span> modes for the same node.
              </Step>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-white/6 flex items-center justify-between text-[10px] text-white/30">
              <span>Built for data scientists who think in graphs.</span>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-400/70 hover:text-emerald-300 transition-colors"
              >
                <KeyRound className="w-3 h-3" />
                Get a Groq key →
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Step({
  num,
  icon,
  accent,
  title,
  children,
}: {
  num: number;
  icon: React.ReactNode;
  accent: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border"
        style={{
          background: `${accent}18`,
          borderColor: `${accent}40`,
          color: accent,
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: accent }}
          >
            Step {num}
          </span>
          <h3 className="text-xs font-semibold text-white/90">{title}</h3>
        </div>
        <div className="text-[11px] leading-relaxed text-white/55">{children}</div>
      </div>
    </div>
  );
}
