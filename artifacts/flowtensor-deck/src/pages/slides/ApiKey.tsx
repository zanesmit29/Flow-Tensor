export default function ApiKey() {
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
          <div className="text-[1vw] text-[#7AA2F7] font-medium flex items-center gap-[0.5vw]">
            <span className="w-[4px] h-[1.2vw] bg-[#7AA2F7] rounded-[2px] -ml-[3vw]" />
            API Key
          </div>
          <div className="text-[1vw] text-[#C0CAF5]/70">Cache</div>
        </div>
        <div className="mt-auto text-[0.8vw] text-[#565F89]">v1.0.0 · 2026</div>
      </aside>

      <main className="flex-1 px-[6vw] py-[8vh] flex flex-col">
        <div className="text-[1vw] text-[#7AA2F7] uppercase tracking-wider font-semibold mb-[2vh]">Privacy</div>

        <h1 className="text-[4.5vw] font-bold text-white -tracking-[0.02em] mb-[2vh] leading-[1]">
          Bring Your Own Key
        </h1>

        <p className="text-[1.4vw] text-[#9AA5CE] leading-relaxed max-w-[42vw] mb-[5vh]">
          A green dot on the gear icon confirms when AI is active. Optional — skip it and FlowTensor uses a shared rate-limited key.
        </p>

        <div className="bg-[#16161E] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh] w-full max-w-[55vw] mb-[4vh] font-mono text-[1vw] leading-relaxed">
          <div className="text-[#9ECE6A]">{">"} GET /api/groq-key-status</div>
          <div className="text-[#C0CAF5] mt-[1vh]">{"{"}</div>
          <div className="pl-[2vw] text-[#C0CAF5]"><span className="text-[#7AA2F7]">"has_key"</span>: <span className="text-[#FF9E64]">true</span>,</div>
          <div className="pl-[2vw] text-[#C0CAF5]"><span className="text-[#7AA2F7]">"source"</span>: <span className="text-[#9ECE6A]">"user"</span>,</div>
          <div className="pl-[2vw] text-[#C0CAF5]"><span className="text-[#7AA2F7]">"persisted"</span>: <span className="text-[#FF9E64]">false</span></div>
          <div className="text-[#C0CAF5]">{"}"}</div>
        </div>

        <div className="grid grid-cols-3 gap-[2vw] max-w-[55vw]">
          <div className="flex items-start gap-[1vw]">
            <div className="w-[0.6vw] h-[0.6vw] bg-[#9ECE6A] rounded-full mt-[0.8vh]" />
            <div>
              <div className="text-[1.1vw] font-semibold text-white mb-[0.3vh]">Session-only</div>
              <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">Stored in browser memory. Cleared on close.</div>
            </div>
          </div>
          <div className="flex items-start gap-[1vw]">
            <div className="w-[0.6vw] h-[0.6vw] bg-[#9ECE6A] rounded-full mt-[0.8vh]" />
            <div>
              <div className="text-[1.1vw] font-semibold text-white mb-[0.3vh]">Never persisted</div>
              <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">Not in cookies, not in localStorage, not in our DB.</div>
            </div>
          </div>
          <div className="flex items-start gap-[1vw]">
            <div className="w-[0.6vw] h-[0.6vw] bg-[#9ECE6A] rounded-full mt-[0.8vh]" />
            <div>
              <div className="text-[1.1vw] font-semibold text-white mb-[0.3vh]">User key wins</div>
              <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">Takes priority over the shared env key.</div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center w-full pt-[3vh]">
          <div className="text-[0.9vw] text-[#565F89] font-mono">13 / 16</div>
          <div className="text-[0.9vw] text-[#565F89]">FlowTensor · 2026</div>
        </div>
      </main>
    </div>
  );
}
