export default function Audience() {
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
          <div className="text-[1vw] text-[#7AA2F7] font-medium flex items-center gap-[0.5vw]">
            <span className="w-[4px] h-[1.2vw] bg-[#7AA2F7] rounded-[2px] -ml-[3vw]" />
            Audience
          </div>
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
          Three Audience Levels
        </h1>

        <p className="text-[1.4vw] text-[#9AA5CE] leading-relaxed max-w-[42vw] mb-[5vh]">
          Pick your reading level and the explanation rewrites itself. Switch mid-session — the panel re-fetches.
        </p>

        <div className="flex flex-col gap-[2vh] max-w-[60vw]">
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="flex items-center gap-[1.5vw] mb-[1vh]">
              <div className="px-[1vw] py-[0.5vh] bg-[#9ECE6A]/15 border border-[#9ECE6A]/30 rounded-[0.3vw] text-[0.85vw] font-mono font-bold text-[#9ECE6A] uppercase tracking-wider">Beginner</div>
              <div className="text-[1vw] text-[#565F89]">Analogies, no jargon</div>
            </div>
            <div className="font-mono text-[1vw] text-[#C0CAF5] leading-relaxed bg-[#16161E] rounded-[0.4vw] px-[1.5vw] py-[1.5vh] border border-white/5">
              <span className="text-[#7AA2F7]">df.dropna</span> removes rows with missing data, like deleting incomplete forms from a stack of surveys.
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="flex items-center gap-[1.5vw] mb-[1vh]">
              <div className="px-[1vw] py-[0.5vh] bg-[#7AA2F7]/15 border border-[#7AA2F7]/30 rounded-[0.3vw] text-[0.85vw] font-mono font-bold text-[#7AA2F7] uppercase tracking-wider">Intermediate</div>
              <div className="text-[1vw] text-[#565F89]">Real terminology, light internals</div>
            </div>
            <div className="font-mono text-[1vw] text-[#C0CAF5] leading-relaxed bg-[#16161E] rounded-[0.4vw] px-[1.5vw] py-[1.5vh] border border-white/5">
              Drops rows where any column is NaN. Returns a new DataFrame; original unchanged unless inplace=True.
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="flex items-center gap-[1.5vw] mb-[1vh]">
              <div className="px-[1vw] py-[0.5vh] bg-[#E0AF68]/15 border border-[#E0AF68]/30 rounded-[0.3vw] text-[0.85vw] font-mono font-bold text-[#E0AF68] uppercase tracking-wider">Pro</div>
              <div className="text-[1vw] text-[#565F89]">Internals, perf, gradient implications</div>
            </div>
            <div className="font-mono text-[1vw] text-[#C0CAF5] leading-relaxed bg-[#16161E] rounded-[0.4vw] px-[1.5vw] py-[1.5vh] border border-white/5">
              O(rows × cols) NaN scan. Reduced 1000→842 rows; verify drop pattern with <span className="text-[#7AA2F7]">isna().sum()</span>.
            </div>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center w-full pt-[3vh]">
          <div className="text-[0.9vw] text-[#565F89] font-mono">11 / 16</div>
          <div className="text-[0.9vw] text-[#565F89]">FlowTensor · 2026</div>
        </div>
      </main>
    </div>
  );
}
