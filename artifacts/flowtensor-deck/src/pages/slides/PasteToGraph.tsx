export default function PasteToGraph() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#1A1B26] text-[#C0CAF5] flex font-display">
      <aside className="w-[22vw] h-screen border-r border-white/5 px-[3vw] py-[5vh] flex flex-col">
        <div className="flex items-center gap-[1vw] mb-[6vh]">
          <div className="w-[1.5vw] h-[1.5vw] bg-[#7AA2F7] rounded-[0.3vw]" />
          <div className="text-[1.2vw] font-semibold text-white">flowtensor.ai</div>
        </div>
        <div className="text-[0.9vw] font-semibold text-[#565F89] uppercase tracking-wider mb-[2vh]">Overview</div>
        <div className="flex flex-col gap-[1.5vh] mb-[4vh]">
          <div className="text-[1vw] text-[#C0CAF5]/70">FlowTensor</div>
          <div className="text-[1vw] text-[#C0CAF5]/70">The Problem</div>
          <div className="text-[1vw] text-[#7AA2F7] font-medium flex items-center gap-[0.5vw]">
            <span className="w-[4px] h-[1.2vw] bg-[#7AA2F7] rounded-[2px] -ml-[3vw]" />
            Paste to Graph
          </div>
        </div>
        <div className="text-[0.9vw] font-semibold text-[#565F89] uppercase tracking-wider mb-[2vh]">Parsing</div>
        <div className="flex flex-col gap-[1.5vh] mb-[4vh]">
          <div className="text-[1vw] text-[#C0CAF5]/70">Languages</div>
          <div className="text-[1vw] text-[#C0CAF5]/70">GitHub Import</div>
          <div className="text-[1vw] text-[#C0CAF5]/70">Examples</div>
        </div>
        <div className="text-[0.9vw] font-semibold text-[#565F89] uppercase tracking-wider mb-[2vh]">AI Explainer</div>
        <div className="flex flex-col gap-[1.5vh]">
          <div className="text-[1vw] text-[#C0CAF5]/70">Panel</div>
          <div className="text-[1vw] text-[#C0CAF5]/70">Format</div>
        </div>
        <div className="mt-auto text-[0.8vw] text-[#565F89]">v1.0.0 · 2026</div>
      </aside>

      <main className="flex-1 px-[6vw] py-[8vh] flex flex-col">
        <div className="text-[1vw] text-[#7AA2F7] uppercase tracking-wider font-semibold mb-[2vh]">Core Flow</div>

        <h1 className="text-[4.5vw] font-bold text-white -tracking-[0.02em] mb-[2vh] leading-[1]">
          Paste to Graph
        </h1>

        <p className="text-[1.4vw] text-[#9AA5CE] leading-relaxed max-w-[42vw] mb-[5vh]">
          Paste Python into the editor. Hit Visualize. FlowTensor's AST parser walks every assignment, call, and forward() pass and produces a typed node + edge graph — usually in under a second.
        </p>

        <div className="flex items-center gap-[2vw] w-full max-w-[60vw]">
          <div className="flex-1 bg-[#16161E] rounded-[0.5vw] border border-white/5 px-[2vw] py-[3vh]">
            <div className="text-[1vw] font-semibold text-white border-b border-white/10 pb-[1vh] mb-[1.5vh]">Input · Python</div>
            <div className="font-mono text-[0.95vw] leading-relaxed">
              <div className="text-[#7AA2F7]">import pandas as pd</div>
              <div className="text-[#C0CAF5]">df = pd.<span className="text-[#7AA2F7]">read_csv</span>(<span className="text-[#9ECE6A]">"sales.csv"</span>)</div>
              <div className="text-[#C0CAF5]">df = df.<span className="text-[#7AA2F7]">dropna</span>()</div>
              <div className="text-[#C0CAF5]">out = df.<span className="text-[#7AA2F7]">groupby</span>(<span className="text-[#9ECE6A]">"region"</span>)</div>
            </div>
          </div>

          <div className="text-[#565F89] text-[2.5vw]">→</div>

          <div className="flex-1 bg-[#16161E] rounded-[0.5vw] border border-white/5 px-[2vw] py-[3vh]">
            <div className="text-[1vw] font-semibold text-white border-b border-white/10 pb-[1vh] mb-[1.5vh]">Output · Graph</div>
            <div className="flex flex-col gap-[1.2vh]">
              <div className="flex items-center gap-[1vw]">
                <div className="w-[1.2vw] h-[1.2vw] rounded-full bg-[#7AA2F7]" />
                <div className="text-[1vw] font-mono text-[#C0CAF5]">read_csv</div>
                <div className="text-[0.85vw] text-[#565F89] ml-auto font-mono">DataFrame</div>
              </div>
              <div className="flex items-center gap-[1vw]">
                <div className="w-[1.2vw] h-[1.2vw] rounded-full bg-[#9ECE6A]" />
                <div className="text-[1vw] font-mono text-[#C0CAF5]">dropna</div>
                <div className="text-[0.85vw] text-[#565F89] ml-auto font-mono">DataFrame</div>
              </div>
              <div className="flex items-center gap-[1vw]">
                <div className="w-[1.2vw] h-[1.2vw] rounded-full bg-[#E0AF68]" />
                <div className="text-[1vw] font-mono text-[#C0CAF5]">groupby</div>
                <div className="text-[0.85vw] text-[#565F89] ml-auto font-mono">GroupBy</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-[5vh] grid grid-cols-3 gap-[2vw] max-w-[60vw]">
          <div className="flex items-center gap-[1vw]">
            <div className="w-[0.6vw] h-[0.6vw] bg-[#9ECE6A] rounded-full" />
            <div className="text-[1vw] text-[#C0CAF5]">Sub-second AST parse</div>
          </div>
          <div className="flex items-center gap-[1vw]">
            <div className="w-[0.6vw] h-[0.6vw] bg-[#9ECE6A] rounded-full" />
            <div className="text-[1vw] text-[#C0CAF5]">Runs in your browser</div>
          </div>
          <div className="flex items-center gap-[1vw]">
            <div className="w-[0.6vw] h-[0.6vw] bg-[#9ECE6A] rounded-full" />
            <div className="text-[1vw] text-[#C0CAF5]">No signup required</div>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center w-full pt-[3vh]">
          <div className="text-[0.9vw] text-[#565F89] font-mono">03 / 16</div>
          <div className="text-[0.9vw] text-[#565F89]">FlowTensor · 2026</div>
        </div>
      </main>
    </div>
  );
}
