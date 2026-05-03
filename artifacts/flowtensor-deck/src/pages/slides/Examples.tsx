export default function Examples() {
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
          <div className="text-[1vw] text-[#C0CAF5]/70">Paste to Graph</div>
        </div>
        <div className="text-[0.9vw] font-semibold text-[#565F89] uppercase tracking-wider mb-[2vh]">Parsing</div>
        <div className="flex flex-col gap-[1.5vh] mb-[4vh]">
          <div className="text-[1vw] text-[#C0CAF5]/70">Languages</div>
          <div className="text-[1vw] text-[#C0CAF5]/70">GitHub Import</div>
          <div className="text-[1vw] text-[#7AA2F7] font-medium flex items-center gap-[0.5vw]">
            <span className="w-[4px] h-[1.2vw] bg-[#7AA2F7] rounded-[2px] -ml-[3vw]" />
            Examples
          </div>
        </div>
        <div className="text-[0.9vw] font-semibold text-[#565F89] uppercase tracking-wider mb-[2vh]">AI Explainer</div>
        <div className="flex flex-col gap-[1.5vh]">
          <div className="text-[1vw] text-[#C0CAF5]/70">Panel</div>
          <div className="text-[1vw] text-[#C0CAF5]/70">Format</div>
        </div>
        <div className="mt-auto text-[0.8vw] text-[#565F89]">v1.0.0 · 2026</div>
      </aside>

      <main className="flex-1 px-[6vw] py-[8vh] flex flex-col">
        <div className="text-[1vw] text-[#7AA2F7] uppercase tracking-wider font-semibold mb-[2vh]">Parsing</div>

        <h1 className="text-[4.5vw] font-bold text-white -tracking-[0.02em] mb-[2vh] leading-[1]">
          Examples Library
        </h1>

        <p className="text-[1.4vw] text-[#9AA5CE] leading-relaxed max-w-[42vw] mb-[4vh]">
          12+ curated, runnable examples grouped by library and difficulty. Click one and the editor types itself in.
        </p>

        <div className="grid grid-cols-2 gap-[2vw] max-w-[58vw]">
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="flex items-center gap-[1vw] mb-[2vh]">
              <div className="w-[0.6vw] h-[0.6vw] bg-[#FF9E64] rounded-full" />
              <div className="text-[1.1vw] font-semibold text-white">PyTorch</div>
              <div className="text-[0.85vw] text-[#565F89] ml-auto font-mono">6 examples</div>
            </div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed font-mono">
              <div>Training Loop · CNN Forward Pass</div>
              <div>Custom Dataset · Transfer Learning</div>
              <div>Autoencoder · Attention</div>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="flex items-center gap-[1vw] mb-[2vh]">
              <div className="w-[0.6vw] h-[0.6vw] bg-[#7AA2F7] rounded-full" />
              <div className="text-[1.1vw] font-semibold text-white">Pandas</div>
              <div className="text-[0.85vw] text-[#565F89] ml-auto font-mono">4 examples</div>
            </div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed font-mono">
              <div>Titanic Cleanup · Feature Engineering</div>
              <div>Sales Aggregation</div>
              <div>Time Series Resampling</div>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="flex items-center gap-[1vw] mb-[2vh]">
              <div className="w-[0.6vw] h-[0.6vw] bg-[#9ECE6A] rounded-full" />
              <div className="text-[1.1vw] font-semibold text-white">NumPy</div>
              <div className="text-[0.85vw] text-[#565F89] ml-auto font-mono">3 examples</div>
            </div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed font-mono">
              <div>Broadcasting Demo</div>
              <div>Matrix Decomposition</div>
              <div>Einsum Patterns</div>
            </div>
          </div>
          <div className="bg-[#7AA2F7]/[0.06] border border-[#7AA2F7]/20 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="text-[0.9vw] text-[#7AA2F7] uppercase tracking-wider font-semibold mb-[1vh]">Try First</div>
            <div className="text-[1.2vw] font-semibold text-white mb-[0.8vh]">Training Loop</div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">
              The featured example. 9 nodes, covers data loading through backprop.
            </div>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center w-full pt-[3vh]">
          <div className="text-[0.9vw] text-[#565F89] font-mono">06 / 16</div>
          <div className="text-[0.9vw] text-[#565F89]">FlowTensor · 2026</div>
        </div>
      </main>
    </div>
  );
}
