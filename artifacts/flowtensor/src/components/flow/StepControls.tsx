import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, X } from 'lucide-react';

export type PlaybackSpeed = 0.5 | 1 | 2;

interface StepControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  onPlayToggle: () => void;
  onSpeedChange: (s: PlaybackSpeed) => void;
  onExit: () => void;
}

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 2];

export default function StepControls({
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  onPrev,
  onNext,
  onReset,
  onPlayToggle,
  onSpeedChange,
  onExit,
}: StepControlsProps) {
  const atStart = currentStep <= 0;
  const atEnd = currentStep >= totalSteps - 1;

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#1a1d24]/85 backdrop-blur-xl border border-white/10 shadow-2xl"
      data-testid="step-controls"
    >
      {/* Reset */}
      <ControlButton
        onClick={onReset}
        title="Reset to first step"
        ariaLabel="Reset"
        testid="step-btn-reset"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </ControlButton>

      {/* Prev */}
      <ControlButton
        onClick={onPrev}
        disabled={atStart}
        title="Previous step"
        ariaLabel="Previous"
        testid="step-btn-prev"
      >
        <SkipBack className="w-3.5 h-3.5" />
      </ControlButton>

      {/* Play / Pause — gradient accent */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onPlayToggle}
        disabled={totalSteps === 0}
        data-testid="step-btn-play"
        className="relative flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50" />
        {isPlaying ? (
          <Pause className="w-4 h-4 text-white relative z-10 fill-current" />
        ) : (
          <Play className="w-4 h-4 text-white relative z-10 fill-current ml-0.5" />
        )}
      </motion.button>

      {/* Next */}
      <ControlButton
        onClick={onNext}
        disabled={atEnd}
        title="Next step"
        ariaLabel="Next"
        testid="step-btn-next"
      >
        <SkipForward className="w-3.5 h-3.5" />
      </ControlButton>

      {/* Step counter */}
      <div
        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/80 tabular-nums min-w-[88px] text-center"
        data-testid="step-counter"
      >
        Step <span className="text-white">{Math.min(currentStep + 1, totalSteps)}</span> of {totalSteps}
      </div>

      {/* Speed segmented control */}
      <div
        role="radiogroup"
        aria-label="Playback speed"
        className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/5 border border-white/10"
      >
        {SPEEDS.map((s) => {
          const selected = speed === s;
          return (
            <button
              key={s}
              role="radio"
              aria-checked={selected}
              aria-pressed={selected}
              onClick={() => onSpeedChange(s)}
              data-testid={`step-speed-${s}`}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold tabular-nums transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
                selected
                  ? 'bg-white/15 text-white shadow-inner'
                  : 'text-white/50 hover:text-white/80'
              }`}
              title={`${s}× playback speed`}
            >
              {s}×
            </button>
          );
        })}
      </div>

      {/* Exit */}
      <div className="w-px h-6 bg-white/10 mx-1" />
      <ControlButton
        onClick={onExit}
        title="Exit step-through mode"
        ariaLabel="Exit"
        testid="step-btn-exit"
        variant="danger"
      >
        <X className="w-3.5 h-3.5" />
      </ControlButton>
    </motion.div>
  );
}

interface ControlButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
  testid?: string;
  variant?: 'default' | 'danger';
}

function ControlButton({
  children,
  onClick,
  disabled,
  title,
  ariaLabel,
  testid,
  variant = 'default',
}: ControlButtonProps) {
  const base =
    'flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed';
  const styles =
    variant === 'danger'
      ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200 border border-red-500/20'
      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10';
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.92 }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      data-testid={testid}
      className={`${base} ${styles}`}
    >
      {children}
    </motion.button>
  );
}
