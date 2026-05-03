export default function AiPanel() {
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
          <div className="text-[1vw] text-[#7AA2F7] font-medium flex items-center gap-[0.5vw]">
            <span className="w-[4px] h-[1.2vw] bg-[#7AA2F7] rounded-[2px] -ml-[3vw]" />
            Panel
          </div>
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
        <div className="text-[1vw] text-[#7AA2F7] uppercase tracking-wider font-semibold mb-[2vh]">AI Explainer</div>

        <h1 className="text-[4.5vw] font-bold text-white -tracking-[0.02em] mb-[2vh] leading-[1]">
          AI Explainer Panel
        </h1>

        <p className="text-[1.4vw] text-[#9AA5CE] leading-relaxed max-w-[42vw] mb-[5vh]">
          Click any operation. A panel slides in from the right with a structured, level-aware breakdown.
        </p>

        <div className="flex items-center px-[2vw] py-[2vh] bg-[#9ECE6A]/10 border border-[#9ECE6A]/20 rounded-[0.5vw] w-fit mb-[4vh]">
          <div className="text-[1.1vw] font-bold text-[#9ECE6A] mr-[1.5vw] font-mono">POST</div>
          <div className="text-[1.2vw] text-white font-mono">/api/explain-node</div>
        </div>

        <div className="grid grid-cols-3 gap-[2vw] max-w-[60vw]">
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="text-[0.85vw] text-[#7AA2F7] uppercase tracking-wider font-semibold mb-[1vh]">Model</div>
            <div className="text-[1.3vw] font-semibold text-white mb-[0.5vh] font-mono">qwen3-32b</div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">Groq's hosted reasoning model. Thinks before answering.</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="text-[0.85vw] text-[#9ECE6A] uppercase tracking-wider font-semibold mb-[1vh]">Latency</div>
            <div className="text-[1.3vw] font-semibold text-white mb-[0.5vh] font-mono">~2-3s</div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">Cold response on first request. Cached responses return instantly.</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="text-[0.85vw] text-[#E0AF68] uppercase tracking-wider font-semibold mb-[1vh]">Context</div>
            <div className="text-[1.3vw] font-semibold text-white mb-[0.5vh] font-mono">full ast</div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">Knows the surrounding code, library, and tensor shapes.</div>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center w-full pt-[3vh]">
          <div className="text-[0.9vw] text-[#565F89] font-mono">09 / 16</div>
          <div className="text-[0.9vw] text-[#565F89]">FlowTensor · 2026</div>
        </div>
      </main>
    </div>
  );
}
