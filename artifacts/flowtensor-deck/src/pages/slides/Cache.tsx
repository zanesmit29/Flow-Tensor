export default function Cache() {
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
          <div className="text-[1vw] text-[#C0CAF5]/70">Format</div>
          <div className="text-[1vw] text-[#C0CAF5]/70">Audience</div>
          <div className="text-[1vw] text-[#C0CAF5]/70">Regenerate</div>
        </div>
        <div className="text-[0.9vw] font-semibold text-[#565F89] uppercase tracking-wider mb-[2vh]">Privacy</div>
        <div className="flex flex-col gap-[1.5vh]">
          <div className="text-[1vw] text-[#C0CAF5]/70">API Key</div>
          <div className="text-[1vw] text-[#7AA2F7] font-medium flex items-center gap-[0.5vw]">
            <span className="w-[4px] h-[1.2vw] bg-[#7AA2F7] rounded-[2px] -ml-[3vw]" />
            Cache
          </div>
        </div>
        <div className="mt-auto text-[0.8vw] text-[#565F89]">v1.0.0 · 2026</div>
      </aside>

      <main className="flex-1 px-[6vw] py-[8vh] flex flex-col">
        <div className="text-[1vw] text-[#7AA2F7] uppercase tracking-wider font-semibold mb-[2vh]">Privacy</div>

        <h1 className="text-[4.5vw] font-bold text-white -tracking-[0.02em] mb-[2vh] leading-[1]">
          Smart Caching
        </h1>

        <p className="text-[1.4vw] text-[#9AA5CE] leading-relaxed max-w-[42vw] mb-[5vh]">
          Identical operation, parameters, and audience level returns instantly with zero tokens spent. Keeps costs near zero on repeat visits.
        </p>

        <div className="bg-[#16161E] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh] w-full max-w-[58vw] mb-[4vh]">
          <div className="text-[0.85vw] text-[#565F89] uppercase tracking-wider font-semibold mb-[1.5vh]">Cache Key</div>
          <div className="font-mono text-[1.05vw] text-[#C0CAF5] leading-relaxed">
            sha256(<span className="text-[#7AA2F7]">operation</span> + <span className="text-[#9ECE6A]">params</span> + <span className="text-[#E0AF68]">shapes</span> + <span className="text-[#FF9E64]">library</span> + <span className="text-[#BB9AF7]">level</span>)
          </div>
        </div>

        <div className="grid grid-cols-2 gap-[2vw] max-w-[58vw]">
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="flex items-center justify-between mb-[1vh]">
              <div className="text-[1.1vw] font-semibold text-white">First request</div>
              <div className="text-[0.9vw] font-mono text-[#E0AF68]">~2.4s</div>
            </div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed font-mono">
              <span className="text-[#7AA2F7]">"source"</span>: <span className="text-[#9ECE6A]">"ai"</span>, <span className="text-[#7AA2F7]">"cached"</span>: <span className="text-[#FF9E64]">false</span>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-[#9ECE6A]/30 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="flex items-center justify-between mb-[1vh]">
              <div className="text-[1.1vw] font-semibold text-white">Repeat request</div>
              <div className="text-[0.9vw] font-mono text-[#9ECE6A]">~12ms</div>
            </div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed font-mono">
              <span className="text-[#7AA2F7]">"source"</span>: <span className="text-[#9ECE6A]">"ai"</span>, <span className="text-[#7AA2F7]">"cached"</span>: <span className="text-[#FF9E64]">true</span>
            </div>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center w-full pt-[3vh]">
          <div className="text-[0.9vw] text-[#565F89] font-mono">14 / 16</div>
          <div className="text-[0.9vw] text-[#565F89]">FlowTensor · 2026</div>
        </div>
      </main>
    </div>
  );
}
