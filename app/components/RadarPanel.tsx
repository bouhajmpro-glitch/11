'use client';
import { Play, Pause } from 'lucide-react';

interface RadarPanelProps {
  totalFrames: number;
  currentIndex: number;
  isPlaying: boolean;
  currentTimestamp: number;
  onPlayPause: (playing: boolean) => void;
  onSeek: (index: number) => void;
}

export default function RadarPanel({
  totalFrames,
  currentIndex,
  isPlaying,
  currentTimestamp,
  onPlayPause,
  onSeek
}: RadarPanelProps) {
  
  const formatTime = (ts: number) => {
    if (!ts) return '--:--';
    return new Date(ts * 1000).toLocaleTimeString('ar-MA', {
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  };

  return (
    <div className="bg-slate-900/90 text-white p-4 rounded-xl shadow-lg w-full max-w-md mx-auto border border-slate-700">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-blue-400">{formatTime(currentTimestamp)}</span>
        <span className="text-xs text-gray-400">{currentIndex + 1}/{totalFrames}</span>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={() => onPlayPause(!isPlaying)}
          className="bg-blue-600 hover:bg-blue-500 p-2 rounded-full transition"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        
        <input
          type="range"
          min="0"
          max={totalFrames - 1}
          value={currentIndex}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>
    </div>
  );
}