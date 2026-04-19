import React from 'react';

export interface SelectionData {
  type: string;
  duration: string;
  velocity: number;
  line: number;
  col: number;
}

interface InspectorProps {
  selection?: SelectionData | null;
  onUpdate?: (updates: Partial<SelectionData>) => void;
}

export default function Inspector({ selection, onUpdate }: InspectorProps) {
  if (!selection) return null;

  return (
    <div className="flex flex-col w-64 bg-slate-900 border-l border-slate-700 h-full text-slate-200 p-4 shrink-0 shadow-lg z-10">
      <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-slate-400">Context Inspector</h2>
      
      <div className="flex flex-col gap-4 flex-grow">
        <div>
          <label htmlFor="duration-select" className="block text-xs mb-1 text-slate-400">Duration</label>
          <select
            id="duration-select"
            aria-label="Duration"
            value={selection.duration}
            onChange={(e) => onUpdate?.({ duration: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
          >
            <option value="1/1">1/1</option>
            <option value="1/2">1/2</option>
            <option value="1/4">1/4</option>
            <option value="1/8">1/8</option>
            <option value="1/16">1/16</option>
          </select>
        </div>

        <div>
          <label htmlFor="velocity-slider" className="block text-xs mb-1 text-slate-400">Velocity: {selection.velocity}</label>
          <input
            id="velocity-slider"
            type="range"
            aria-label="Velocity"
            min="0"
            max="127"
            value={selection.velocity}
            onChange={(e) => onUpdate?.({ velocity: parseInt(e.target.value, 10) })}
            className="w-full accent-blue-500"
          />
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-800 text-xs text-slate-500 font-mono">
        Line: {selection.line}, Col: {selection.col}
      </div>
    </div>
  );
}
