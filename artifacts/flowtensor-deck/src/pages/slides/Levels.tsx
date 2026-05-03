export default function Levels() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#1A1B26] text-[#C0CAF5] flex font-display">
      <aside className="w-[22vw] h-screen border-r border-white/5 px-[3vw] py-[5vh] flex flex-col">
        <div className="flex items-center gap-[1vw] mb-[6vh]">
          <div className="w-[1.5vw] h-[1.5vw] bg-[#7AA2F7] rounded-[0.3vw]" />
          <div className="text-[1.2vw] font-semibold text-white">flowtensor.ai</div>
        </div>
        <div className="text-[0.9vw] font-semibold text-[#565F89] uppercase tracking-wider mb-[2vh]">Visualization</div>
        <div className="flex flex-col gap-[1.5vh] mb-[4vh]">
          <div className="text-[1vw] text-[#7AA2F7] font-medium flex items-center gap-[0.5vw]">
            <span className="w-[4px] h-[1.2vw] bg-[#7AA2F7] rounded-[2px] -ml-[3vw]" />
            Levels of Detail
          </div>
          <div className="text-[1vw] text-[#C0CAF5]/70">Custom Nodes</div>
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
          Three Levels of Detail
        </h1>

        <p className="text-[1.4vw] text-[#9AA5CE] leading-relaxed max-w-[42vw] mb-[5vh]">
          Same code, three depths. Drill in only as deep as you need.
        </p>

        <div className="flex flex-col gap-[2vh] max-w-[60vw]">
          <div className="flex items-center gap-[2vw] bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-[0.5vw] bg-[#7AA2F7]/15 border border-[#7AA2F7]/30 flex items-center justify-center text-[#7AA2F7] font-mono text-[1.5vw] font-bold">L1</div>
            <div className="flex-1">
              <div className="text-[1.3vw] font-semibold text-white mb-[0.5vh]">High-level blocks</div>
              <div className="text-[1vw] text-[#9AA5CE]">Whole models. Whole pipelines. One node = one logical unit.</div>
            </div>
            <div className="font-mono text-[0.95vw] text-[#565F89]">3-8 nodes</div>
          </div>
          <div className="flex items-center gap-[2vw] bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-[0.5vw] bg-[#9ECE6A]/15 border border-[#9ECE6A]/30 flex items-center justify-center text-[#9ECE6A] font-mono text-[1.5vw] font-bold">L2</div>
            <div className="flex-1">
              <div className="text-[1.3vw] font-semibold text-white mb-[0.5vh]">Logical groups</div>
              <div className="text-[1vw] text-[#9AA5CE]">Encoder, decoder, preprocessing stages, sub-modules.</div>
            </div>
            <div className="font-mono text-[0.95vw] text-[#565F89]">10-30 nodes</div>
          </div>
          <div className="flex items-center gap-[2vw] bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-[0.5vw] bg-[#E0AF68]/15 border border-[#E0AF68]/30 flex items-center justify-center text-[#E0AF68] font-mono text-[1.5vw] font-bold">L3</div>
            <div className="flex-1">
              <div className="text-[1.3vw] font-semibold text-white mb-[0.5vh]">Every individual operation</div>
              <div className="text-[1vw] text-[#9AA5CE]">Conv2d, BatchNorm, ReLU, view, matmul — each as its own node.</div>
            </div>
            <div className="font-mono text-[0.95vw] text-[#565F89]">30-200 nodes</div>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center w-full pt-[3vh]">
          <div className="text-[0.9vw] text-[#565F89] font-mono">07 / 16</div>
          <div className="text-[0.9vw] text-[#565F89]">FlowTensor · 2026</div>
        </div>
      </main>
    </div>
  );
}
