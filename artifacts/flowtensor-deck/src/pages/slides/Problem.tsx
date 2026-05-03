export default function Problem() {
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
          <div className="text-[1vw] text-[#7AA2F7] font-medium flex items-center gap-[0.5vw]">
            <span className="w-[4px] h-[1.2vw] bg-[#7AA2F7] rounded-[2px] -ml-[3vw]" />
            The Problem
          </div>
          <div className="text-[1vw] text-[#C0CAF5]/70">Paste to Graph</div>
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
        <div className="text-[1vw] text-[#7AA2F7] uppercase tracking-wider font-semibold mb-[2vh]">Overview</div>

        <h1 className="text-[4.5vw] font-bold text-white -tracking-[0.02em] mb-[3vh] leading-[1]">
          Code reads top-to-bottom.<span className="block text-[#7AA2F7]">Tensors don't.</span>
        </h1>

        <p className="text-[1.4vw] text-[#9AA5CE] leading-relaxed max-w-[42vw] mb-[5vh]">
          Reading ML code line by line hides what's actually happening to the data. Shapes change. Tensors get reshaped, broadcast, transposed, fused — and none of it is visible until something breaks.
        </p>

        <div className="grid grid-cols-3 gap-[2vw] max-w-[55vw]">
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="text-[2.8vw] font-bold text-[#FF9E64] -tracking-[0.02em] leading-none mb-[1vh]">68%</div>
            <div className="text-[1vw] text-[#9AA5CE] leading-snug">of debugging time spent tracing tensor shapes by hand</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="text-[2.8vw] font-bold text-[#E0AF68] -tracking-[0.02em] leading-none mb-[1vh]">3x</div>
            <div className="text-[1vw] text-[#9AA5CE] leading-snug">faster comprehension when data flow is visualized</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="text-[2.8vw] font-bold text-[#9ECE6A] -tracking-[0.02em] leading-none mb-[1vh]">0</div>
            <div className="text-[1vw] text-[#9AA5CE] leading-snug">tools that turn arbitrary Python into a typed graph in your browser</div>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center w-full pt-[3vh]">
          <div className="text-[0.9vw] text-[#565F89] font-mono">02 / 16</div>
          <div className="text-[0.9vw] text-[#565F89]">FlowTensor · 2026</div>
        </div>
      </main>
    </div>
  );
}
