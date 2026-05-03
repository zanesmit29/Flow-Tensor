import React, { useState, useEffect, useRef, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { useParseCode } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, Sparkles } from 'lucide-react';
import GraphCanvas from '@/components/flow/GraphCanvas';
import ExamplesPanel from '@/components/ExamplesPanel';
import { type Example } from '@/data/examples';

const DEFAULT_CODE = `import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F

# ── 1. Load & Clean ──────────────────────────────────────────
df = pd.read_csv("transactions.csv")
df = df.dropna()
df = df.drop_duplicates()
df = df.rename(columns={"amt": "amount", "ts": "timestamp"})
df = df.astype({"amount": float, "user_id": int})

# ── 2. Feature Engineering ───────────────────────────────────
df = df.sort_values("timestamp")
df["amount_zscore"] = (df["amount"] - df["amount"].mean()) / df["amount"].std()
df["rolling_avg"] = df.groupby("user_id")["amount"].transform(
    lambda x: x.rolling(7, min_periods=1).mean()
)
df = df.fillna(0)
stats = df.groupby("user_id").agg({"amount": "sum", "amount_zscore": "mean"})
stats = stats.reset_index()
df = df.merge(stats, on="user_id", suffixes=("", "_agg"))
df = df.drop(columns=["timestamp"])

# ── 3. Build Tensors ─────────────────────────────────────────
X = torch.tensor(df[["amount_zscore", "rolling_avg", "amount_agg"]].values, dtype=torch.float32)
y = torch.tensor(df["label"].values, dtype=torch.long)
X = F.normalize(X, dim=0)

# ── 4. Fraud Detection Model ─────────────────────────────────
class FraudDetector(nn.Module):
    def __init__(self, input_dim=3, hidden=128, num_classes=2):
        super().__init__()
        self.embedding = nn.Embedding(10000, 16)
        self.bn_input = nn.BatchNorm1d(input_dim)
        self.fc1 = nn.Linear(input_dim, hidden)
        self.bn1 = nn.BatchNorm1d(hidden)
        self.drop1 = nn.Dropout(0.3)
        self.fc2 = nn.Linear(hidden, hidden // 2)
        self.bn2 = nn.BatchNorm1d(hidden // 2)
        self.drop2 = nn.Dropout(0.2)
        self.fc3 = nn.Linear(hidden // 2, 32)
        self.fc_out = nn.Linear(32, num_classes)
        self.relu = nn.ReLU()
        self.softmax = nn.Softmax(dim=1)

    def forward(self, x):
        x = self.bn_input(x)
        x = self.fc1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.drop1(x)
        x = self.fc2(x)
        x = self.bn2(x)
        x = self.relu(x)
        x = self.drop2(x)
        x = self.fc3(x)
        x = self.relu(x)
        logits = self.fc_out(x)
        return self.softmax(logits)

model = FraudDetector()
loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

# ── 5. Training Loop ─────────────────────────────────────────
for epoch in range(10):
    logits = model(X)
    loss = loss_fn(logits, y)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
`;

export default function Home() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [hasVisualized, setHasVisualized] = useState(false);

  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visualizeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mutateRef = useRef<((args: { data: { code: string } }) => void) | null>(null);

  const { toast } = useToast();

  const parseMutation = useParseCode({
    mutation: {
      onSuccess: () => setHasVisualized(true),
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to parse code';
        toast({
          title: 'Parse Error',
          description: errorMessage,
          variant: 'destructive',
        });
      },
    },
  });

  // Keep a ref to the mutate fn so typewriter callback can call it without stale closure
  mutateRef.current = parseMutation.mutate;

  // Forced dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.backgroundColor = '#0f1117';
    document.body.style.backgroundColor = '#0f1117';
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (typewriterRef.current) clearTimeout(typewriterRef.current);
      if (visualizeRef.current) clearTimeout(visualizeRef.current);
    };
  }, []);

  const handleVisualize = useCallback((codeToRun?: string) => {
    const target = codeToRun ?? code;
    if (!target.trim()) {
      toast({
        title: 'Empty code',
        description: 'Please enter some PyTorch or Pandas code.',
        variant: 'destructive',
      });
      return;
    }
    parseMutation.mutate({ data: { code: target } });
  }, [code, parseMutation, toast]);

  const handleExampleSelect = useCallback((example: Example) => {
    setIsPanelOpen(false);

    // Cancel any running typewriter
    if (typewriterRef.current) clearTimeout(typewriterRef.current);
    if (visualizeRef.current) clearTimeout(visualizeRef.current);

    setIsTyping(true);
    setCode('');

    const target = example.code;
    let i = 0;

    const tick = () => {
      i++;
      setCode(target.slice(0, i));

      if (i < target.length) {
        typewriterRef.current = setTimeout(tick, 20);
      } else {
        // Typing done — wait 600ms then auto-visualize
        setIsTyping(false);
        visualizeRef.current = setTimeout(() => {
          mutateRef.current?.({ data: { code: target } });
          setHasVisualized(true);
        }, 600);
      }
    };

    typewriterRef.current = setTimeout(tick, 20);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0f1117] text-white">
      {/* Left Panel: Editor */}
      <div className="w-[45%] flex flex-col border-r border-white/10 bg-[#0f1117] relative z-10 shadow-2xl">

        {/* Navbar */}
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1a1d24]/50 backdrop-blur-md">
          {/* Logo + Title */}
          <button
            type="button"
            onClick={() => {
              if (window.location.hash) {
                history.pushState('', document.title, window.location.pathname + window.location.search);
                window.dispatchEvent(new HashChangeEvent('hashchange'));
              }
            }}
            className="flex items-center gap-3 rounded-lg p-1 -m-1 hover:bg-white/5 transition-colors"
            aria-label="Back to landing page"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className="text-left">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">FlowTensor</h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Graph Visualizer</p>
            </div>
          </button>

          {/* Examples button */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsPanelOpen((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isPanelOpen
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Examples
            </motion.button>
          </div>
        </div>

        {/* Examples dropdown — rendered at left-panel level to escape navbar stacking context */}
        <ExamplesPanel
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          onSelect={handleExampleSelect}
          isTyping={isTyping}
        />

        {/* Typewriter status bar */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 border-b border-blue-500/20 text-xs text-blue-300"
          >
            <span className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '120ms' }} />
              <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '240ms' }} />
            </span>
            Loading example...
          </motion.div>
        )}

        {/* Code Editor */}
        <div className="flex-1 overflow-auto bg-[#282c34]">
          <CodeMirror
            value={code}
            height="100%"
            theme={oneDark}
            extensions={[python()]}
            onChange={(value) => {
              if (!isTyping) setCode(value);
            }}
            className="h-full text-sm font-mono"
            style={{ minHeight: '100%' }}
            editable={!isTyping}
          />
        </div>

        {/* Visualize button */}
        <div className="p-6 bg-[#0f1117] border-t border-white/10 relative z-20">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleVisualize()}
            disabled={parseMutation.isPending || isTyping}
            className="w-full relative group overflow-hidden rounded-xl bg-card disabled:opacity-80 disabled:cursor-not-allowed"
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-80 group-hover:opacity-100 transition-opacity ${parseMutation.isPending ? 'animate-pulse' : ''}`} />

            {!parseMutation.isPending && !isTyping && (
              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-40 animate-[shimmer_2s_infinite]" />
            )}

            <div className="relative px-6 py-4 flex items-center justify-center gap-2 text-white font-semibold tracking-wide shadow-2xl">
              {parseMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing Tensor Flow...</span>
                </>
              ) : isTyping ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading Example...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Visualize Data Flow</span>
                </>
              )}
            </div>
          </motion.button>
        </div>
      </div>

      {/* Right Panel: Canvas */}
      <div className="flex-1 relative bg-[#0f1117]">
        <GraphCanvas
          data={parseMutation.data}
          isPending={parseMutation.isPending}
        />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(200%) skewX(-12deg); }
        }
      `}} />
    </div>
  );
}
