export default function Languages() {
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
          <div className="text-[1vw] text-[#7AA2F7] font-medium flex items-center gap-[0.5vw]">
            <span className="w-[4px] h-[1.2vw] bg-[#7AA2F7] rounded-[2px] -ml-[3vw]" />
            Languages
          </div>
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
        <div className="text-[1vw] text-[#7AA2F7] uppercase tracking-wider font-semibold mb-[2vh]">Parsing</div>

        <h1 className="text-[4.5vw] font-bold text-white -tracking-[0.02em] mb-[2vh] leading-[1]">
          Multi-Library Support
        </h1>

        <p className="text-[1.4vw] text-[#9AA5CE] leading-relaxed max-w-[42vw] mb-[5vh]">
          Three of the four most-used data libraries, parsed natively. Same editor, same graph, same AI panel.
        </p>

        <div className="grid grid-cols-3 gap-[2vw] max-w-[60vw]">
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[3vh]">
            <div className="flex items-center gap-[1vw] mb-[2vh]">
              <div className="w-[2vw] h-[2vw] bg-[#FF9E64]/15 border border-[#FF9E64]/30 rounded-[0.4vw] flex items-center justify-center text-[#FF9E64] font-mono text-[1.1vw] font-bold">P</div>
              <div className="text-[1.4vw] font-semibold text-white">PyTorch</div>
            </div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">
              <div>nn.Module subclasses</div>
              <div>forward() tracing</div>
              <div>Conv2d, Linear, BatchNorm</div>
              <div>Functional ops</div>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[3vh]">
            <div className="flex items-center gap-[1vw] mb-[2vh]">
              <div className="w-[2vw] h-[2vw] bg-[#7AA2F7]/15 border border-[#7AA2F7]/30 rounded-[0.4vw] flex items-center justify-center text-[#7AA2F7] font-mono text-[1.1vw] font-bold">D</div>
              <div className="text-[1.4vw] font-semibold text-white">Pandas</div>
            </div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">
              <div>DataFrame operations</div>
              <div>groupby and aggregations</div>
              <div>merges and joins</div>
              <div>chained transforms</div>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[3vh]">
            <div className="flex items-center gap-[1vw] mb-[2vh]">
              <div className="w-[2vw] h-[2vw] bg-[#9ECE6A]/15 border border-[#9ECE6A]/30 rounded-[0.4vw] flex items-center justify-center text-[#9ECE6A] font-mono text-[1.1vw] font-bold">N</div>
              <div className="text-[1.4vw] font-semibold text-white">NumPy</div>
            </div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">
              <div>Array creation</div>
              <div>broadcasting and reshapes</div>
              <div>reductions, einsum</div>
              <div>linear algebra</div>
            </div>
          </div>
        </div>

        <div className="mt-[5vh] flex items-center gap-[1vw] text-[1vw] text-[#565F89]">
          <div className="w-[0.6vw] h-[0.6vw] bg-[#E0AF68] rounded-full" />
          <div>TensorFlow support coming soon</div>
        </div>

        <div className="mt-auto flex justify-between items-center w-full pt-[3vh]">
          <div className="text-[0.9vw] text-[#565F89] font-mono">04 / 16</div>
          <div className="text-[0.9vw] text-[#565F89]">FlowTensor · 2026</div>
        </div>
      </main>
    </div>
  );
}
