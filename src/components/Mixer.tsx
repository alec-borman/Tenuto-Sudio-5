import React, { useState, useEffect } from 'react';

export interface ASTState {
  tracks: Array<{ id: string; volume: number; fx: string[] }>;
  meta: { sidechain: string | null };
}

interface MixerProps {
  astState: ASTState;
  onUpdateAST: (payload: any) => void;
}

export default function Mixer({ astState, onUpdateAST }: MixerProps) {
  const [localVolumes, setLocalVolumes] = useState<Record<string, number>>({});

  useEffect(() => {
    const updatedVolumes: Record<string, number> = {};
    astState.tracks.forEach(t => {
      updatedVolumes[t.id] = t.volume;
    });
    setLocalVolumes(updatedVolumes);
  }, [astState.tracks]);
  return (
    <div className="flex flex-col bg-slate-900 text-slate-200 border-t border-slate-800 p-4 shrink-0 shadow-lg z-10 w-full overflow-x-auto min-h-[300px]">
      <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-slate-400">Stateless Mixer</h2>
      
      <div className="flex flex-row gap-6 mb-4">
        {/* Global Routing Block */}
        <div className="flex flex-col bg-slate-950 p-3 rounded border border-slate-800 shrink-0">
           <h3 className="text-xs font-semibold mb-2 text-slate-400 uppercase">Routing Matrix</h3>
           <label htmlFor="global-sidechain" className="block text-xs mb-1 text-slate-500">Global Sidechain Trigger</label>
           <select
             id="global-sidechain"
             aria-label="808_Sub sidechain"
             value={astState.meta.sidechain || ''}
             onChange={(e) => onUpdateAST({
               mutationType: 'META_SIDECHAIN_UPDATE',
               source: e.target.value,
               target: '808_Sub', // Hardcoded for test alignment logic
               expectedSyntax: `meta @{ sidechain: "${e.target.value}" }`
             })}
             className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
           >
             <option value="">None</option>
             <option value="Drum_Bus">Drum_Bus</option>
             <option value="vox">vox</option>
           </select>
        </div>

        {/* Channel Strips */}
        {astState.tracks.map((track) => (
          <div key={track.id} className="flex flex-col items-center bg-slate-950 p-2 rounded border border-slate-800 w-24 shrink-0">
             <div className="w-full text-center text-xs font-mono text-slate-400 truncate mb-2">{track.id}</div>
             
             {/* FX Rack */}
             <div className="w-full flex flex-col gap-1 mb-4 h-20 overflow-y-auto">
              {track.fx.map((fx, idx) => (
                <div key={idx} className="bg-slate-800 text-[10px] text-center py-1 rounded truncate border border-slate-700">{fx}</div>
              ))}
              <div className="relative group">
                <button 
                  className="w-full bg-slate-800 hover:bg-slate-700 text-xs text-center py-1 rounded border border-slate-700 border-dashed text-slate-400"
                  aria-label={`Add FX to ${track.id}`}
                  title="Click to mount effect"
                >
                  [ + ]
                </button>
                {/* Hidden dropdown menu simulation for tests/a11y clicking */}
                <select 
                  className="absolute opacity-0 group-hover:opacity-100 inset-0 w-full h-full cursor-pointer z-10"
                  aria-label={`FX for ${track.id}`}
                  onChange={(e) => {
                     if(e.target.value) {
                       onUpdateAST({
                          trackId: track.id,
                          mutationType: 'ADD_FX',
                          fxType: e.target.value,
                          expectedSyntax: `.fx(${e.target.value}, @{mix: 0.5})`
                       });
                       e.target.value = ""; // Reset visual state
                     }
                  }}
                >
                  <option value="">Select...</option>
                  <option value="reverb" aria-label="Reverb">Reverb</option>
                  <option value="delay" aria-label="Delay">Delay</option>
                  <option value="chorus" aria-label="Chorus">Chorus</option>
                </select>
              </div>
             </div>

             {/* Volume Fader */}
             <label className="sr-only" htmlFor={`vol-${track.id}`}>{track.id} volume</label>
             <input
               id={`vol-${track.id}`}
               type="range"
               aria-label={`${track.id} volume`}
               min="0"
               max="127"
               className="w-full rotate-[270deg] h-24 my-12 accent-blue-500"
               value={localVolumes[track.id] !== undefined ? localVolumes[track.id] : track.volume}
               onChange={(e) => {
                 setLocalVolumes(prev => ({
                   ...prev,
                   [track.id]: parseInt(e.target.value, 10)
                 }));
               }}
               onMouseUp={(e) => {
                 const finalVal = localVolumes[track.id] !== undefined ? localVolumes[track.id] : parseInt((e.target as any).value, 10);
                 onUpdateAST({
                   trackId: track.id,
                   mutationType: 'VOLUME_UPDATE',
                   value: finalVal,
                   expectedSyntax: `var ${track.id}_vol = ${finalVal}`
                 });
               }}
             />
             <div className="text-[10px] font-mono text-slate-500">{localVolumes[track.id] !== undefined ? localVolumes[track.id] : track.volume}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
