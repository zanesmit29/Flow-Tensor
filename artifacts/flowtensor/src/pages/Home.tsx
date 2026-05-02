import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { useParseCode } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play } from 'lucide-react';
import GraphCanvas from '@/components/flow/GraphCanvas';

const DEFAULT_CODE = `import pandas as pd
import torch
import torch.nn as nn

# Pandas Data Prep
df = pd.read_csv("dataset.csv")
df = df.dropna()
features = df[['age', 'income', 'score']]
labels = df['target']

# PyTorch Model
class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(3, 64)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(64, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        out = self.sigmoid(x)
        return out
`;

export default function Home() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const { toast } = useToast();
  
  const parseMutation = useParseCode({
    mutation: {
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || error.message || "Failed to parse code";
        toast({
          title: "Parse Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  });

  const handleVisualize = () => {
    if (!code.trim()) {
      toast({
        title: "Empty code",
        description: "Please enter some PyTorch or Pandas code.",
        variant: "destructive",
      });
      return;
    }
    parseMutation.mutate({ data: { code } });
  };

  // Set forced dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.backgroundColor = '#0f1117';
    document.body.style.backgroundColor = '#0f1117';
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0f1117] text-white">
      {/* Left Panel: Editor */}
      <div className="w-[45%] flex flex-col border-r border-white/10 bg-[#0f1117] relative z-10 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1a1d24]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">FlowTensor</h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Graph Visualizer</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-[#282c34]">
          <CodeMirror
            value={code}
            height="100%"
            theme={oneDark}
            extensions={[python()]}
            onChange={(value) => setCode(value)}
            className="h-full text-sm font-mono"
            style={{ minHeight: '100%' }}
          />
        </div>

        <div className="p-6 bg-[#0f1117] border-t border-white/10 relative z-20">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleVisualize}
            disabled={parseMutation.isPending}
            className="w-full relative group overflow-hidden rounded-xl bg-card disabled:opacity-80 disabled:cursor-not-allowed"
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-80 group-hover:opacity-100 transition-opacity ${parseMutation.isPending ? 'animate-pulse' : ''}`} />
            
            {/* Animated shimmer effect */}
            {!parseMutation.isPending && (
              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-40 animate-[shimmer_2s_infinite]" />
            )}
            
            <div className="relative px-6 py-4 flex items-center justify-center gap-2 text-white font-semibold tracking-wide shadow-2xl">
              {parseMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing Tensor Flow...</span>
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
