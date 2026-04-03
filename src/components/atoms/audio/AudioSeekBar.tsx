import { useState } from "react";

import { audioSingleton } from "../../../lib/audioSingleton";
import { useAudioTimeStore } from "../../../store/audioTime";

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TimeDisplay() {
  const currentTime = useAudioTimeStore((s) => s.currentTime);
  return (
    <span className="text-xs text-gray-400">
      {formatDuration(Math.floor(currentTime))}
    </span>
  );
}

export function SeekBar({ duration, staticValue }: { duration: number; staticValue?: number }) {
  const storeTime = useAudioTimeStore((s) => s.currentTime);
  const currentTime = staticValue !== undefined ? staticValue : storeTime;
  const [dragging, setDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  const displayValue = dragging ? dragValue : currentTime;
  const percent = duration > 0 ? (displayValue / duration) * 100 : 0;

  return (
    <input
      type="range"
      min={0}
      max={duration || 1}
      step={1}
      value={displayValue}
      className="w-full h-1 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
      style={{
        background: `linear-gradient(to right, rgba(255,255,255,0.85) ${percent}%, rgba(255,255,255,0.2) ${percent}%)`,
      }}
      onMouseDown={() => {
        setDragging(true);
        setDragValue(currentTime);
      }}
      onTouchStart={() => {
        setDragging(true);
        setDragValue(currentTime);
      }}
      onChange={(e) => setDragValue(Number(e.target.value))}
      onMouseUp={(e) => {
        const val = Number((e.target as HTMLInputElement).value);
        audioSingleton.getAudio().currentTime = val;
        useAudioTimeStore.getState().setCurrentTime(val);
        setDragging(false);
      }}
      onTouchEnd={(e) => {
        const val = Number(e.currentTarget.value);
        audioSingleton.getAudio().currentTime = val;
        useAudioTimeStore.getState().setCurrentTime(val);
        setDragging(false);
      }}
    />
  );
}
