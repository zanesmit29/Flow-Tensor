export default function Title() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#1A1B26] text-[#C0CAF5] flex font-display">
      <aside className="w-[22vw] h-screen border-r border-white/5 px-[3vw] py-[5vh] flex flex-col">
        <div className="flex items-center gap-[1vw] mb-[6vh]">
          <div className="w-[1.5vw] h-[1.5vw] bg-[#7AA2F7] rounded-[0.3vw]" />
          <div className="text-[1.2vw] font-semibold text-white">flowtensor.ai</div>
        </div>
        <div className="text-[0.9vw] font-semibold text-[#565F89] uppercase tracking-wider mb-[2vh]">Overview</div>
        <div className="flex flex-col gap-[1.5vh] mb-[4vh]">
          <div className="text-[1vw] text-[#7AA2F7] font-medium flex items-center gap-[0.5vw]">
            <span className="w-[4px] h-[1.2vw] bg-[#7AA2F7] rounded-[2px] -ml-[3vw]" />
            FlowTensor
          </div>
          <div className="text-[1vw] text-[#C0CAF5]/70">The Problem</div>
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
        <div className="text-[1vw] text-[#7AA2F7] uppercase tracking-wider font-semibold mb-[2vh]">Product Reference</div>

        <h1 className="text-[6vw] font-bold text-white -tracking-[0.02em] leading-[0.95] mb-[2vh]">
          FlowTensor
        </h1>

        <p className="text-[1.5vw] text-[#9AA5CE] leading-relaxed max-w-[42vw] mb-[5vh]">
          See your code, not just read it. Paste any PyTorch, Pandas, or NumPy script and watch it become an interactive data-flow graph with AI explanations on every node.
        </p>

        <div className="flex items-center px-[2vw] py-[2vh] bg-[#9ECE6A]/10 border border-[#9ECE6A]/20 rounded-[0.5vw] w-fit mb-[4vh]">
          <div className="text-[1.1vw] font-bold text-[#9ECE6A] mr-[1.5vw] font-mono">POST</div>
          <div className="text-[1.2vw] text-white font-mono">/api/parse</div>
        </div>

        <div className="flex gap-[3vw]">
          <div className="flex-1 flex flex-col gap-[2vh]">
            <div className="text-[1.1vw] font-semibold text-white border-b border-white/10 pb-[1vh]">Request</div>
            <div className="bg-[#16161E] rounded-[0.5vw] px-[2vw] py-[2.5vh] border border-white/5 font-mono text-[0.95vw] leading-relaxed">
              <div className="text-[#7AA2F7]">import torch.nn as nn</div>
              <div className="text-[#C0CAF5]"><span className="text-[#BB9AF7]">class</span> <span className="text-[#E0AF68]">Net</span>(nn.Module):</div>
              <div className="text-[#C0CAF5] pl-[2vw]"><span className="text-[#BB9AF7]">def</span> <span className="text-[#7AA2F7]">forward</span>(self, x):</div>
              <div className="text-[#C0CAF5] pl-[4vw]">x = self.conv(x)</div>
              <div className="text-[#C0CAF5] pl-[4vw]"><span className="text-[#BB9AF7]">return</span> self.fc(x)</div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-[2vh]">
            <div className="flex justify-between items-center border-b border-white/10 pb-[1vh]">
              <div className="text-[1.1vw] font-semibold text-white">Response</div>
              <div className="flex items-center gap-[0.5vw]">
                <div className="w-[0.6vw] h-[0.6vw] bg-[#9ECE6A] rounded-full" />
                <div className="text-[0.9vw] font-mono text-[#9ECE6A]">200 OK</div>
              </div>
            </div>
            <div className="bg-[#16161E] rounded-[0.5vw] px-[2vw] py-[2.5vh] border border-white/5 font-mono text-[0.95vw] leading-relaxed">
              <div className="text-[#C0CAF5]">{"{"}</div>
              <div className="pl-[2vw]"><span className="text-[#7AA2F7]">"nodes"</span>: <span className="text-[#FF9E64]">7</span>,</div>
              <div className="pl-[2vw]"><span className="text-[#7AA2F7]">"edges"</span>: <span className="text-[#FF9E64]">6</span>,</div>
              <div className="pl-[2vw]"><span className="text-[#7AA2F7]">"blocks"</span>: <span className="text-[#FF9E64]">1</span>,</div>
              <div className="pl-[2vw]"><span className="text-[#7AA2F7]">"latency_ms"</span>: <span className="text-[#FF9E64]">42</span></div>
              <div className="text-[#C0CAF5]">{"}"}</div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center w-full pt-[3vh]">
          <div className="text-[0.9vw] text-[#565F89] font-mono">01 / 16</div>
          <div className="text-[0.9vw] text-[#565F89]">FlowTensor · 2026</div>
        </div>
      </main>
    </div>
  );
}
