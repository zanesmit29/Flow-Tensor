export default function Closing() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#1A1B26] text-[#C0CAF5] font-display">
      <div
        className="w-full h-full flex flex-col items-center justify-center px-[8vw] py-[10vh] relative"
        style={{ background: "radial-gradient(circle at center, rgba(122, 162, 247, 0.12) 0%, transparent 60%)" }}
      >
        <div className="w-[4vw] h-[4vw] bg-[#7AA2F7] rounded-[1vw] mb-[4vh] flex items-center justify-center">
          <div className="w-[2vw] h-[2vw] bg-[#1A1B26] rounded-[0.5vw]" />
        </div>

        <h1 className="text-[6vw] font-bold text-white -tracking-[0.02em] text-center mb-[3vh] leading-[1]">
          Try FlowTensor
        </h1>

        <p className="text-[1.5vw] text-[#9AA5CE] leading-relaxed max-w-[42vw] text-center mb-[6vh]">
          Open the app, paste a model, click a node. No install, no signup, no setup.
        </p>

        <div className="font-mono text-[1.3vw] text-white bg-[#16161E] border border-white/10 rounded-[0.5vw] px-[2vw] py-[2vh] mb-[8vh]">
          <span className="text-[#9ECE6A]">→</span> flowtensor.ai
        </div>

        <div className="flex gap-[4vw] border-t border-white/5 pt-[4vh]">
          <div className="flex items-center gap-[1vw]">
            <div className="w-[0.8vw] h-[0.8vw] bg-[#9ECE6A] rounded-full" />
            <div className="text-[1.1vw] text-[#C0CAF5]">Runs in your browser</div>
          </div>
          <div className="flex items-center gap-[1vw]">
            <div className="w-[0.8vw] h-[0.8vw] bg-[#E0AF68] rounded-full" />
            <div className="text-[1.1vw] text-[#C0CAF5]">PyTorch · Pandas · NumPy</div>
          </div>
          <div className="flex items-center gap-[1vw]">
            <div className="w-[0.8vw] h-[0.8vw] bg-[#7AA2F7] rounded-full" />
            <div className="text-[1.1vw] text-[#C0CAF5]">AI on every node</div>
          </div>
        </div>

        <div className="absolute bottom-[5vh] left-[8vw] right-[8vw] flex justify-between items-center">
          <div className="text-[0.9vw] text-[#565F89] font-mono">16 / 16</div>
          <div className="text-[0.9vw] text-[#565F89]">FlowTensor · 2026</div>
        </div>
      </div>
    </div>
  );
}
