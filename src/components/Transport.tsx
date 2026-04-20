import React from 'react';

interface TransportProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export default function Transport({ isPlaying, onTogglePlay }: TransportProps) {
  return (
    <div className="h-12 w-full bg-slate-900 border-b border-slate-800 flex items-center px-4 shrink-0 shadow-lg z-20 relative">
      <div className="flex-1 font-ui text-sm font-semibold tracking-wider text-slate-300">
        Tenuto<span className="text-blue-500 font-bold px-1">Studio</span>5
      </div>
      <div className="flex items-center justify-center flex-1">
        <button
          onClick={onTogglePlay}
          className="bg-blue-600 hover:bg-blue-500 transition-colors shadow-md text-white font-bold py-1 px-8 rounded-md text-sm uppercase"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
      <div className="flex-1" />
    </div>
  );
}
