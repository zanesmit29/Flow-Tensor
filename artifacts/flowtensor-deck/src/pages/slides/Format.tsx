export default function Format() {
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
          <div className="text-[1vw] text-[#C0CAF5]/70">Custom Nodes</div>
        </div>
        <div className="text-[0.9vw] font-semibold text-[#565F89] uppercase tracking-wider mb-[2vh]">AI Explainer</div>
        <div className="flex flex-col gap-[1.5vh] mb-[4vh]">
          <div className="text-[1vw] text-[#C0CAF5]/70">Panel</div>
          <div className="text-[1vw] text-[#7AA2F7] font-medium flex items-center gap-[0.5vw]">
            <span className="w-[4px] h-[1.2vw] bg-[#7AA2F7] rounded-[2px] -ml-[3vw]" />
            Format
          </div>
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
        <div className="text-[1vw] text-[#7AA2F7] uppercase tracking-wider font-semibold mb-[2vh]">AI Explainer</div>

        <h1 className="text-[4.5vw] font-bold text-white -tracking-[0.02em] mb-[2vh] leading-[1]">
          What / Impact / Tip / Risk
        </h1>

        <p className="text-[1.4vw] text-[#9AA5CE] leading-relaxed max-w-[42vw] mb-[5vh]">
          Every explanation comes back in four labeled sections. Same shape every time, so your eye knows where to look.
        </p>

        <div className="grid grid-cols-2 gap-[2vw] max-w-[58vw]">
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="flex items-center gap-[1vw] mb-[1.5vh]">
              <div className="px-[1vw] py-[0.5vh] bg-[#7AA2F7]/15 border border-[#7AA2F7]/30 rounded-[0.3vw] text-[0.85vw] font-mono font-bold text-[#7AA2F7] uppercase tracking-wider">What</div>
            </div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">
              What this operation actually does, in plain language. The behavior, not the API surface.
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="flex items-center gap-[1vw] mb-[1.5vh]">
              <div className="px-[1vw] py-[0.5vh] bg-[#9ECE6A]/15 border border-[#9ECE6A]/30 rounded-[0.3vw] text-[0.85vw] font-mono font-bold text-[#9ECE6A] uppercase tracking-wider">Impact</div>
            </div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">
              What it does to your data and shapes — with the actual numbers from your code, not generic examples.
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="flex items-center gap-[1vw] mb-[1.5vh]">
              <div className="px-[1vw] py-[0.5vh] bg-[#E0AF68]/15 border border-[#E0AF68]/30 rounded-[0.3vw] text-[0.85vw] font-mono font-bold text-[#E0AF68] uppercase tracking-wider">Tip</div>
            </div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">
              A concrete optimization, alternative API, or idiomatic improvement worth considering.
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="flex items-center gap-[1vw] mb-[1.5vh]">
              <div className="px-[1vw] py-[0.5vh] bg-[#FF9E64]/15 border border-[#FF9E64]/30 rounded-[0.3vw] text-[0.85vw] font-mono font-bold text-[#FF9E64] uppercase tracking-wider">Risk</div>
            </div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">
              A real failure mode to watch for — silent shape mismatches, bias from missing data, gradient blow-ups.
            </div>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center w-full pt-[3vh]">
          <div className="text-[0.9vw] text-[#565F89] font-mono">10 / 16</div>
          <div className="text-[0.9vw] text-[#565F89]">FlowTensor · 2026</div>
        </div>
      </main>
    </div>
  );
}
