export default function Regenerate() {
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
          <div className="text-[1vw] text-[#7AA2F7] font-medium flex items-center gap-[0.5vw]">
            <span className="w-[4px] h-[1.2vw] bg-[#7AA2F7] rounded-[2px] -ml-[3vw]" />
            Regenerate
          </div>
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
          Explain Differently
        </h1>

        <p className="text-[1.4vw] text-[#9AA5CE] leading-relaxed max-w-[42vw] mb-[5vh]">
          The first explanation didn't land? One click regenerates from scratch with a different angle. Especially useful for tricky operators where one framing rarely covers it.
        </p>

        <div className="flex items-center gap-[2vw] max-w-[60vw] mb-[5vh]">
          <div className="flex-1 bg-[#16161E] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="text-[0.85vw] text-[#7AA2F7] uppercase tracking-wider font-semibold mb-[1vh]">Attempt 1</div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed font-mono">
              "<span className="text-[#7AA2F7]">einsum</span> contracts dimensions according to the index pattern..."
            </div>
          </div>
          <div className="text-[#7AA2F7] text-[2.5vw] font-mono">⟲</div>
          <div className="flex-1 bg-[#16161E] border border-[#7AA2F7]/30 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="text-[0.85vw] text-[#9ECE6A] uppercase tracking-wider font-semibold mb-[1vh]">Attempt 2</div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed font-mono">
              "Think of <span className="text-[#7AA2F7]">'ij,jk-&gt;ik'</span> as a matrix multiply, written out by index..."
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-[2vw] max-w-[55vw]">
          <div className="flex flex-col gap-[0.5vh]">
            <div className="text-[1.1vw] font-semibold text-white">Einsum patterns</div>
            <div className="text-[1vw] text-[#9AA5CE]">Index notation that resists one-shot explanations.</div>
          </div>
          <div className="flex flex-col gap-[0.5vh]">
            <div className="text-[1.1vw] font-semibold text-white">Broadcasting</div>
            <div className="text-[1vw] text-[#9AA5CE]">Different mental models work for different shapes.</div>
          </div>
          <div className="flex flex-col gap-[0.5vh]">
            <div className="text-[1.1vw] font-semibold text-white">Attention masks</div>
            <div className="text-[1vw] text-[#9AA5CE]">Causal vs padding vs custom — needs context.</div>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center w-full pt-[3vh]">
          <div className="text-[0.9vw] text-[#565F89] font-mono">12 / 16</div>
          <div className="text-[0.9vw] text-[#565F89]">FlowTensor · 2026</div>
        </div>
      </main>
    </div>
  );
}
