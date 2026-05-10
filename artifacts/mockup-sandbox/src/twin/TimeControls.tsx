import { Play, Pause, SkipBack, SkipForward, Gauge } from "lucide-react";
import type { Theme } from "./types";

interface TimeControlsProps {
  simDayOffset: number;
  onSimDayOffsetChange: (v: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  speed: number;
  onSpeedChange: (s: number) => void;
  c: Theme;
}

function formatOffset(offset: number): string {
  if (offset < 0.1) return "▶ Live";
  if (offset < 1) return "Last 24h";
  if (offset < 2) return "1 day ago";
  if (offset < 7) return `${Math.round(offset)} days ago`;
  if (offset < 14) return "~1 week ago";
  if (offset < 21) return "~2 weeks ago";
  if (offset < 28) return "~3 weeks ago";
  return "30 days ago";
}

const SPEEDS = [0.5, 1, 2, 5];

export function TimeControls({
  simDayOffset,
  onSimDayOffsetChange,
  isPlaying,
  onPlayPause,
  speed,
  onSpeedChange,
  c,
}: TimeControlsProps) {
  const panel: React.CSSProperties = {
    position: "fixed",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    width: "min(680px, calc(100vw - 280px))",
    background: c.panel,
    border: `1px solid ${c.border}`,
    borderRadius: 20,
    padding: "14px 20px",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    zIndex: 900,
    boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    gap: 14,
  };

  const nextSpeed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];

  return (
    <div style={panel}>
      <button
        onClick={() => onSimDayOffsetChange(30)}
        style={{ background: "none", border: "none", cursor: "pointer", color: c.muted, padding: 4 }}
        title="Reset to 30 days ago"
      >
        <SkipBack size={18} />
      </button>

      <button
        onClick={onPlayPause}
        style={{
          width: 38, height: 38, borderRadius: "50%",
          background: c.primary, border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#fff",
          boxShadow: `0 0 20px ${c.primary}66`,
          flexShrink: 0,
        }}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>

      <button
        onClick={() => onSimDayOffsetChange(0)}
        style={{ background: "none", border: "none", cursor: "pointer", color: c.muted, padding: 4 }}
        title="Jump to now"
      >
        <SkipForward size={18} />
      </button>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: c.muted }}>30 days ago</span>
          <span style={{
            fontSize: 12, fontWeight: 700, color: c.primary,
            background: c.primary + "18", padding: "2px 10px", borderRadius: 99,
          }}>
            {formatOffset(simDayOffset)}
          </span>
          <span style={{ fontSize: 11, color: c.muted }}>Now</span>
        </div>
        <input
          type="range"
          min={0}
          max={30}
          step={0.1}
          value={30 - simDayOffset}
          onChange={(e) => onSimDayOffsetChange(30 - Number(e.target.value))}
          style={{
            width: "100%",
            appearance: "none",
            height: 4,
            borderRadius: 99,
            background: `linear-gradient(to right, ${c.primary} ${((30 - simDayOffset) / 30) * 100}%, ${c.panel2} 0%)`,
            cursor: "pointer",
            outline: "none",
          }}
        />
      </div>

      <button
        onClick={() => onSpeedChange(nextSpeed)}
        title={`Speed: ${speed}x — click to change`}
        style={{
          display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
          borderRadius: 8, border: `1px solid ${c.border}`,
          background: c.panel2, cursor: "pointer", color: c.text,
          fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}
      >
        <Gauge size={14} color={c.primary} />
        {speed}×
      </button>
    </div>
  );
}
