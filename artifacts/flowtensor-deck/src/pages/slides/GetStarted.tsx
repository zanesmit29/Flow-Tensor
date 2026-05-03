export default function GetStarted() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#1A1B26] text-[#C0CAF5] flex font-display">
      <aside className="w-[22vw] h-screen border-r border-white/5 px-[3vw] py-[5vh] flex flex-col">
        <div className="flex items-center gap-[1vw] mb-[6vh]">
          <div className="w-[1.5vw] h-[1.5vw] bg-[#7AA2F7] rounded-[0.3vw]" />
          <div className="text-[1.2vw] font-semibold text-white">flowtensor.ai</div>
        </div>
        <div className="text-[0.9vw] font-semibold text-[#565F89] uppercase tracking-wider mb-[2vh]">Help</div>
        <div className="flex flex-col gap-[1.5vh] mb-[4vh]">
          <div className="text-[1vw] text-[#7AA2F7] font-medium flex items-center gap-[0.5vw]">
            <span className="w-[4px] h-[1.2vw] bg-[#7AA2F7] rounded-[2px] -ml-[3vw]" />
            Get Started
          </div>
        </div>
        <div className="text-[0.9vw] font-semibold text-[#565F89] uppercase tracking-wider mb-[2vh]">Resources</div>
        <div className="flex flex-col gap-[1.5vh]">
          <div className="text-[1vw] text-[#C0CAF5]/70">Examples</div>
          <div className="text-[1vw] text-[#C0CAF5]/70">GitHub Import</div>
          <div className="text-[1vw] text-[#C0CAF5]/70">Keyboard Shortcuts</div>
        </div>
        <div className="mt-auto text-[0.8vw] text-[#565F89]">v1.0.0 · 2026</div>
      </aside>

      <main className="flex-1 px-[6vw] py-[8vh] flex flex-col">
        <div className="text-[1vw] text-[#7AA2F7] uppercase tracking-wider font-semibold mb-[2vh]">Walkthrough</div>

        <h1 className="text-[4.5vw] font-bold text-white -tracking-[0.02em] mb-[2vh] leading-[1]">
          How To Get Started
        </h1>

        <p className="text-[1.4vw] text-[#9AA5CE] leading-relaxed max-w-[42vw] mb-[5vh]">
          A built-in 5-step walkthrough lives behind the "How to get started" tab. Roughly four minutes from URL to first explained tensor.
        </p>

        <div className="flex flex-col gap-[2vh] max-w-[60vw]">
          <div className="flex items-center gap-[1.5vw]">
            <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#7AA2F7]/15 border border-[#7AA2F7]/30 flex items-center justify-center text-[#7AA2F7] font-mono text-[1.1vw] font-bold flex-shrink-0">1</div>
            <div className="text-[1.3vw] text-white">Paste your code, or pick an example</div>
          </div>
          <div className="flex items-center gap-[1.5vw]">
            <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#9ECE6A]/15 border border-[#9ECE6A]/30 flex items-center justify-center text-[#9ECE6A] font-mono text-[1.1vw] font-bold flex-shrink-0">2</div>
            <div className="text-[1.3vw] text-white">Click <span className="font-mono text-[#9ECE6A]">Visualize</span></div>
          </div>
          <div className="flex items-center gap-[1.5vw]">
            <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#E0AF68]/15 border border-[#E0AF68]/30 flex items-center justify-center text-[#E0AF68] font-mono text-[1.1vw] font-bold flex-shrink-0">3</div>
            <div className="text-[1.3vw] text-white">Drill from Level 1 down to Level 3</div>
          </div>
          <div className="flex items-center gap-[1.5vw]">
            <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#FF9E64]/15 border border-[#FF9E64]/30 flex items-center justify-center text-[#FF9E64] font-mono text-[1.1vw] font-bold flex-shrink-0">4</div>
            <div className="text-[1.3vw] text-white">Click any node to open the AI panel</div>
          </div>
          <div className="flex items-center gap-[1.5vw]">
            <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#BB9AF7]/15 border border-[#BB9AF7]/30 flex items-center justify-center text-[#BB9AF7] font-mono text-[1.1vw] font-bold flex-shrink-0">5</div>
            <div className="text-[1.3vw] text-white">Read What, Impact, Tip, and Risk</div>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center w-full pt-[3vh]">
          <div className="text-[0.9vw] text-[#565F89] font-mono">15 / 16</div>
          <div className="text-[0.9vw] text-[#565F89]">FlowTensor · 2026</div>
        </div>
      </main>
    </div>
  );
}
