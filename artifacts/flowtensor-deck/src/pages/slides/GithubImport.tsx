export default function GithubImport() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#1A1B26] text-[#C0CAF5] flex font-display">
      <aside className="w-[22vw] h-screen border-r border-white/5 px-[3vw] py-[5vh] flex flex-col">
        <div className="flex items-center gap-[1vw] mb-[6vh]">
          <div className="w-[1.5vw] h-[1.5vw] bg-[#7AA2F7] rounded-[0.3vw]" />
          <div className="text-[1.2vw] font-semibold text-white">flowtensor.ai</div>
        </div>
        <div className="text-[0.9vw] font-semibold text-[#565F89] uppercase tracking-wider mb-[2vh]">Overview</div>
        <div className="flex flex-col gap-[1.5vh] mb-[4vh]">
          <div className="text-[1vw] text-[#C0CAF5]/70">FlowTensor</div>
          <div className="text-[1vw] text-[#C0CAF5]/70">The Problem</div>
          <div className="text-[1vw] text-[#C0CAF5]/70">Paste to Graph</div>
        </div>
        <div className="text-[0.9vw] font-semibold text-[#565F89] uppercase tracking-wider mb-[2vh]">Parsing</div>
        <div className="flex flex-col gap-[1.5vh] mb-[4vh]">
          <div className="text-[1vw] text-[#C0CAF5]/70">Languages</div>
          <div className="text-[1vw] text-[#7AA2F7] font-medium flex items-center gap-[0.5vw]">
            <span className="w-[4px] h-[1.2vw] bg-[#7AA2F7] rounded-[2px] -ml-[3vw]" />
            GitHub Import
          </div>
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
        <div className="text-[1vw] text-[#7AA2F7] uppercase tracking-wider font-semibold mb-[2vh]">Parsing</div>

        <h1 className="text-[4.5vw] font-bold text-white -tracking-[0.02em] mb-[2vh] leading-[1]">
          GitHub Import
        </h1>

        <p className="text-[1.4vw] text-[#9AA5CE] leading-relaxed max-w-[42vw] mb-[5vh]">
          Skip the copy-paste. Drop a GitHub URL into the importer and FlowTensor fetches the file and parses it directly.
        </p>

        <div className="bg-[#16161E] rounded-[0.5vw] border border-white/5 px-[2vw] py-[2.5vh] w-full max-w-[55vw] mb-[4vh]">
          <div className="text-[0.85vw] text-[#565F89] uppercase tracking-wider font-semibold mb-[1.2vh]">Importer</div>
          <div className="flex items-center gap-[1.5vw]">
            <div className="text-[#9ECE6A] font-mono text-[1.1vw] font-bold">GET</div>
            <div className="font-mono text-[1.05vw] text-[#C0CAF5] flex-1 truncate">
              github.com/karpathy/nanoGPT/blob/master/<span className="text-[#7AA2F7]">model.py</span>
            </div>
            <div className="text-[#9ECE6A] font-mono text-[0.95vw]">200</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-[2vw] max-w-[55vw]">
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="text-[1.1vw] font-semibold text-white mb-[1vh]">Public repos</div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">
              Any public file or folder. No GitHub auth required.
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="text-[1.1vw] font-semibold text-white mb-[1vh]">Single files or folders</div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">
              Paste one file URL, or a folder URL to pick from a list.
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="text-[1.1vw] font-semibold text-white mb-[1vh]">Branches and tags</div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">
              Works with any ref — main, master, a release tag, a feature branch.
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-[0.5vw] px-[2vw] py-[2.5vh]">
            <div className="text-[1.1vw] font-semibold text-white mb-[1vh]">Cached fetch</div>
            <div className="text-[1vw] text-[#9AA5CE] leading-relaxed">
              Repeat imports of the same URL skip the network round-trip.
            </div>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center w-full pt-[3vh]">
          <div className="text-[0.9vw] text-[#565F89] font-mono">05 / 16</div>
          <div className="text-[0.9vw] text-[#565F89]">FlowTensor · 2026</div>
        </div>
      </main>
    </div>
  );
}
