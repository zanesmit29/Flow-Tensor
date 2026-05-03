import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, X, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { useAISettings } from '@/contexts/AISettingsContext';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

type ValidationState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'valid' }
  | { kind: 'invalid'; message: string }
  | { kind: 'error'; message: string };

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { hasKey, source, explanationCount, saveKey, refreshStatus } = useAISettings();
  const [keyInput, setKeyInput] = useState('');
  const [show, setShow] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [validation, setValidation] = useState<ValidationState>({ kind: 'idle' });
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setKeyInput('');
      setValidation({ kind: 'idle' });
      setShow(false);
    }
  }, [open]);

  // Debounced live validation against Groq's /models endpoint
  useEffect(() => {
    if (!keyInput || keyInput.trim().length < 8) {
      setValidation({ kind: 'idle' });
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setValidation({ kind: 'checking' });
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${keyInput.trim()}` },
        });
        if (res.status === 200) {
          setValidation({ kind: 'valid' });
        } else if (res.status === 401) {
          setValidation({ kind: 'invalid', message: 'Invalid key — check and try again' });
        } else {
          setValidation({ kind: 'error', message: 'Could not validate key' });
        }
      } catch {
        setValidation({ kind: 'error', message: 'Could not validate key' });
      }
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [keyInput]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // If "enabled" is unchecked, send empty key to clear backend state
      await saveKey(enabled ? keyInput.trim() : '');
      refreshStatus();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const prefixWarning = keyInput.length > 4 && !keyInput.startsWith('gsk_');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-label="Settings"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#13161d] shadow-2xl text-white"
            data-testid="settings-modal"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <span aria-hidden>⚙️</span> Settings
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                aria-label="Close settings"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-5">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Explainer
                </h3>

                <label htmlFor="groq-key" className="block text-sm font-medium text-white/80 mb-1.5">
                  Groq API Key
                </label>
                <div className="relative">
                  <input
                    id="groq-key"
                    type={show ? 'text' : 'password'}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="gsk_••••••••••••••••••••••••••••"
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full rounded-lg bg-[#0f1117] border border-white/10 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 outline-none px-3 py-2 pr-10 text-sm font-mono text-white placeholder:text-white/25"
                    data-testid="input-groq-key"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label={show ? 'Hide key' : 'Show key'}
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <p className="mt-2 text-[11px] text-white/40 leading-relaxed">
                  Your key is never stored — re-enter on each session.
                </p>

                <div className="mt-3 min-h-[20px] text-xs">
                  {validation.kind === 'checking' && (
                    <span className="text-white/50 flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" /> Validating…
                    </span>
                  )}
                  {validation.kind === 'valid' && (
                    <span className="text-emerald-400">● Valid key · llama3-8b-8192 ready ✅</span>
                  )}
                  {validation.kind === 'invalid' && (
                    <span className="text-rose-400">❌ {validation.message}</span>
                  )}
                  {validation.kind === 'error' && (
                    <span className="text-amber-400">⚠️ {validation.message}</span>
                  )}
                  {validation.kind === 'idle' && prefixWarning && (
                    <span className="text-amber-400">⚠️ Groq keys usually start with “gsk_”</span>
                  )}
                  {validation.kind === 'idle' && !prefixWarning && hasKey && !keyInput && (
                    <span className="text-emerald-400/80">
                      ● Key already configured ({source === 'user' ? 'this session' : 'environment'})
                    </span>
                  )}
                </div>

                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  Get a free Groq API key
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2">
                <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="accent-blue-500 w-4 h-4"
                  />
                  AI Explanations enabled
                </label>
                <p className="text-xs text-white/45">
                  Session: {explanationCount} explanation{explanationCount === 1 ? '' : 's'} generated
                </p>
              </div>
            </div>

            <div className="flex justify-end px-5 py-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || (enabled && !!keyInput && validation.kind === 'invalid')}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-900/30 flex items-center gap-2"
                data-testid="btn-save-settings"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
