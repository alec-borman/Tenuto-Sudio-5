import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import WebGPUCanvas from './WebGPUCanvas';
import Inspector from './Inspector';
import Mixer, { ASTState } from './Mixer';
import AICopilot from './AICopilot';
import CodeEditor from './CodeEditor';
import Transport from './Transport';
import { LanceDBOrchestrator } from '../ai/LanceDBOrchestrator';
import { CommandManager } from '../commands/CommandManager';
import { AudioContextManager } from '../audio/AudioContextManager';
import { PlaybackOrchestrator } from '../audio/PlaybackOrchestrator';
import { ASTSerializer } from '../parser/ASTSerializer';
import { TCALManager } from '../audio/TCALManager';
import { IncrementalCompiler } from '../parser/IncrementalCompiler';

export default function SplitWorkspace() {
  const [sourceCode, setSourceCode] = useState<string>('pno: c4:4');
  const [activeSelection, setActiveSelection] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const isAudioInitialized = useRef<boolean>(false);
  const [astState, setAstState] = useState<ASTState>({
    tracks: [{ id: 'vox', volume: 100, fx: [] }],
    meta: { sidechain: null }
  });
  
  const orchestrator = useMemo(() => new LanceDBOrchestrator(), []);
  const commandManager = useMemo(() => new CommandManager(), []);
  const audioManager = useMemo(() => new AudioContextManager(), []);
  const serializer = useMemo(() => new ASTSerializer(), []);
  const incrementalCompiler = useMemo(() => new IncrementalCompiler(serializer), [serializer]);
  const playbackOrchestrator = useMemo(() => new PlaybackOrchestrator(serializer, new TCALManager(), audioManager), [audioManager, serializer]);

  const [compiledEvents, setCompiledEvents] = useState<any[]>([]);

  useEffect(() => {
    try {
      const parsedEvents = incrementalCompiler.update(sourceCode);
      setCompiledEvents(parsedEvents);
    } catch (e) {
      // Graceful Degradation: Silently catch partial syntaxes
    }
  }, [sourceCode, incrementalCompiler]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          commandManager.redo();
        } else {
          commandManager.undo();
        }
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandManager, isPlaying]);

  const handleTogglePlay = async () => {
    if (!isAudioInitialized.current) {
      await audioManager.initialize();
      isAudioInitialized.current = true;
    }
    
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    
    if (nextPlaying) {
      await playbackOrchestrator.compileAndPlay(sourceCode);
    }
  };

  const handleUpdateAST = (newStatePayload: Partial<ASTState>) => {
    const prevState = { ...astState };
    const nextState = { ...astState, ...newStatePayload };
    
    commandManager.executeCommand({
      execute: () => setAstState(nextState),
      undo: () => setAstState(prevState)
    });
  };

  const handleCodeEdit = (nextCode: string) => {
    const prevCode = sourceCode;
    commandManager.executeCommand({
      execute: () => setSourceCode(nextCode),
      undo: () => setSourceCode(prevCode)
    });
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col">
      <Group orientation="horizontal" className="flex-grow">
        <Panel defaultSize={20} minSize={20} id="left-hemisphere">
          <Group orientation="vertical">
            <Panel defaultSize={70}>
              <div className="h-full w-full border-r border-slate-800 bg-slate-900 flex flex-col">
                <div className="h-6 bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-semibold pl-2 flex items-center shrink-0">
                  Editor
                </div>
                <div className="flex-grow overflow-hidden">
                  <CodeEditor code={sourceCode} onChange={handleCodeEdit} />
                </div>
              </div>
            </Panel>
            <Separator className="h-1 bg-slate-800 hover:bg-slate-700 transition-colors cursor-row-resize z-10" />
            <Panel defaultSize={30}>
              <div className="h-full w-full border-r border-slate-800 bg-slate-900 flex flex-col">
                <div className="h-6 bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-semibold pl-2 flex items-center shrink-0">
                  History
                </div>
                <div data-testid="command-history-panel" className="p-2 text-xs text-slate-500">
                  Command Manager / History
                </div>
              </div>
            </Panel>
          </Group>
        </Panel>

        <Separator className="w-1 bg-slate-800 hover:bg-slate-700 transition-colors cursor-col-resize z-10" />

        <Panel id="center-crucible">
          <Group orientation="vertical">
            <Panel defaultSize={10} minSize={10}>
              <div className="flex flex-col h-full w-full">
                <div className="h-6 bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-semibold pl-2 flex items-center shrink-0">
                  Transport
                </div>
                <div className="flex-grow overflow-hidden">
                   <Transport isPlaying={isPlaying} onTogglePlay={handleTogglePlay} />
                </div>
              </div>
            </Panel>
            <Separator className="h-1 bg-slate-800 hover:bg-slate-700 transition-colors cursor-row-resize z-10" />
            <Panel defaultSize={60} minSize={30}>
              <div className="h-full w-full bg-slate-900 flex flex-col">
                <div className="h-6 bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-semibold pl-2 flex items-center shrink-0 relative z-20">
                  Canvas & Inspection
                </div>
                <Group orientation="horizontal" className="flex-grow">
                  <Panel defaultSize={80} minSize={30}>
                    <div className="h-full w-full relative">
                      <WebGPUCanvas onSelect={setActiveSelection} events={compiledEvents} />
                    </div>
                  </Panel>
                  <Separator className="w-1 bg-slate-800 hover:bg-slate-700 transition-colors cursor-col-resize z-10" />
                  <Panel defaultSize={20} minSize={15}>
                    <div className="h-full w-full bg-slate-900">
                      <Inspector selection={activeSelection} onUpdate={() => {}} />
                    </div>
                  </Panel>
                </Group>
              </div>
            </Panel>
            <Separator className="h-1 bg-slate-800 hover:bg-slate-700 transition-colors cursor-row-resize z-10" />
            <Panel defaultSize={30} minSize={20}>
              <div className="flex flex-col h-full w-full">
                <div className="h-6 bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-semibold pl-2 flex items-center shrink-0">
                  Mixer
                </div>
                <div className="flex-grow overflow-hidden">
                   <Mixer astState={astState} onUpdateAST={handleUpdateAST} />
                </div>
              </div>
            </Panel>
          </Group>
        </Panel>

        <Separator className="w-1 bg-slate-800 hover:bg-slate-700 transition-colors cursor-col-resize z-10" />

        <Panel defaultSize={20} minSize={15} id="right-hemisphere">
          <Group orientation="vertical">
             <Panel defaultSize={50}>
               <div className="h-full w-full bg-slate-900 flex flex-col">
                  <div className="h-6 bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-semibold pl-2 flex items-center shrink-0">
                    Routing & Output
                  </div>
                  <div data-testid="engine-status-panel" className="p-2 text-xs text-slate-500">
                    Playback Orchestrator
                  </div>
               </div>
             </Panel>
             <Separator className="h-1 bg-slate-800 hover:bg-slate-700 transition-colors cursor-row-resize z-10" />
             <Panel defaultSize={50}>
                <div className="h-full w-full bg-slate-900 flex flex-col">
                  <div className="h-6 bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-semibold pl-2 flex items-center shrink-0">
                    Intelligence
                  </div>
                  <div className="flex-grow overflow-hidden relative">
                    <AICopilot 
                      activeAST={activeSelection ? `${activeSelection.type}:${activeSelection.duration}` : "empty_state"}
                      orchestrator={orchestrator}
                      onCommit={(cmd) => { console.log('Committed ghost AST command:', cmd.payload); }}
                    />
                  </div>
                </div>
             </Panel>
          </Group>
        </Panel>

      </Group>
    </div>
  );
}
