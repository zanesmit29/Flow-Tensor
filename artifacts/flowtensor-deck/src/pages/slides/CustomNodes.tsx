export default function CustomNodes() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#1A1B26] text-[#C0CAF5] flex font-display">
      <aside className="w-[22vw] h-screen border-r border-white/5 px-[3vw] py-[5vh] flex flex-col">
        <div className="flex items-center gap-[1vw] mb-[6vh]">
          <div className="w-[1.5vw] h-[1.5vw] bg-[#7AA2F7] rounded-[0.3vw]" />
          <div className="text-[1.2vw] font-semibold text-white">flowtensor.ai</div>
        </div>
        <div className="text-[0.9vw] font-semibold text-[#565F89] uppercase tracking-wider mb-[2vh]">Visualization</div>
        <div className="flex flex-col gap-[1.5vh] mb-[4vh]">
          <div className="text-[1vw] text-[#C0CAF5]/70">Levels of Detail</div>
          <div className="text-[1vw] text-[#7AA2F7] font-medium flex items-center gap-[0.5vw]">
            <span className="w-[4px] h-[1.2vw] bg-[#7AA2F7] rounded-[2px] -ml-[3vw]" />
            Custom Nodes
          </div>
        </div>
        <div className="text-[0.9vw] font-semibold text-[#565F89] uppercase tracking-wider mb-[2vh]">AI Explainer</div>
        <div className="flex flex-col gap-[1.5vh] mb-[4vh]">
          <div className="text-[1vw] text-[#C0CAF5]/70">Panel</div>
          <div className="text-[1vw] text-[#C0CAF5]/70">Format</div>
          <div className="text-[1vw] text-[#C0CAF5]/70">Audience</div>
          <div className="text-[1vw] text-[#C0CAF5]/70">Regenerate</div>
        </div>
        <div className="text-[0.9vw] font-semibold text-[#565F89] uppercase tracking-wider mb-[2vh]">Privacy</div>
        <div className="flex flex-col gap-[1.5vh]">
          <div className="text-[1vw] text-[#C0CAF5]/70">API Key</div>
          <div className="text-[1vw] text-[#C0CAF5]/70">Cache</div>
        </div>
        <div className="mt-auto text-[0.8vw] text-[#565F89]">v1.0.0 · 2026</div>
      </aside>

      <main className="flex-1 px-[6vw] py-[8vh] flex flex-col">
        <div className="text-[1vw] text-[#7AA2F7] uppercase tracking-wider font-semibold mb-[2vh]">Visualization</div>

        <h1 className="text-[4.5vw] font-bold text-white -tracking-[0.02em] mb-[2vh] leading-[1]">
          Typed Custom Nodes
        </h1>

        <p className="text-[1.4vw] text-[#9AA5CE] leading-relaxed max-w-[42vw] mb-[5vh]">
          Every node is shaped and colored by what it actually does. Hover any node and a faint AI badge appears on the corner.
        </p>

        <div className="grid grid-cols-5 gap-[1.5vw] max-w-[60vw]">
          <div className="bg-[#7AA2F7]/10 border border-[#7AA2F7]/30 rounded-[0.5vw] px-[1vw] py-[2vh] flex flex-col items-center gap-[1vh]">
            <div className="w-[2.2vw] h-[2.2vw] bg-[#7AA2F7] rounded-[0.4vw]" />
            <div className="text-[0.95vw] text-white font-mono">Linear</div>
            <div className="text-[0.8vw] text-[#9AA5CE]">layer</div>
          </div>
          <div className="bg-[#9ECE6A]/10 border border-[#9ECE6A]/30 rounded-[0.5vw] px-[1vw] py-[2vh] flex flex-col items-center gap-[1vh]">
            <div className="w-[2.2vw] h-[2.2vw] bg-[#9ECE6A] rounded-full" />
            <div className="text-[0.95vw] text-white font-mono">ReLU</div>
            <div className="text-[0.8vw] text-[#9AA5CE]">activation</div>
          </div>
          <div className="bg-[#E0AF68]/10 border border-[#E0AF68]/30 rounded-[0.5vw] px-[1vw] py-[2vh] flex flex-col items-center gap-[1vh]">
            <div className="w-[2.2vw] h-[2.2vw] bg-[#E0AF68] rotate-45" />
            <div className="text-[0.95vw] text-white font-mono">view</div>
            <div className="text-[0.8vw] text-[#9AA5CE]">reshape</div>
          </div>
          <div className="bg-[#FF9E64]/10 border border-[#FF9E64]/30 rounded-[0.5vw] px-[1vw] py-[2vh] flex flex-col items-center gap-[1vh]">
            <div className="w-[2.2vw] h-[2.2vw] bg-[#FF9E64]" style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
            <div className="text-[0.95vw] text-white font-mono">groupby</div>
            <div className="text-[0.8vw] text-[#9AA5CE]">df op</div>
          </div>
          <div className="bg-[#BB9AF7]/10 border border-[#BB9AF7]/30 rounded-[0.5vw] px-[1vw] py-[2vh] flex flex-col items-center gap-[1vh]">
            <div className="w-[2.2vw] h-[2.2vw] bg-[#BB9AF7] rounded-[1.1vw]" style={{ clipPath: "polygon(0 50%, 25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%)" }} />
            <div className="text-[0.95vw] text-white font-mono">sum</div>
            <div className="text-[0.8vw] text-[#9AA5CE]">reduction</div>
          </div>
        </div>

        <div className="mt-[5vh] grid grid-cols-3 gap-[2vw] max-w-[55vw]">
          <div className="flex items-start gap-[1vw]">
            <div className="text-[2vw] font-bold text-[#7AA2F7] font-mono leading-none">01</div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">Distinct shape per operation type — no two categories look alike.</div>
          </div>
          <div className="flex items-start gap-[1vw]">
            <div className="text-[2vw] font-bold text-[#9ECE6A] font-mono leading-none">02</div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">Tensor shapes shown inline on each edge between nodes.</div>
          </div>
          <div className="flex items-start gap-[1vw]">
            <div className="text-[2vw] font-bold text-[#E0AF68] font-mono leading-none">03</div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">Hover reveals the AI badge — click to open the explainer panel.</div>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center w-full pt-[3vh]">
          <div className="text-[0.9vw] text-[#565F89] font-mono">08 / 16</div>
          <div className="text-[0.9vw] text-[#565F89]">FlowTensor · 2026</div>
        </div>
      </main>
    </div>
  );
}
