import React, { useState, useMemo, useEffect, useRef } from 'react';
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
      <Transport isPlaying={isPlaying} onTogglePlay={handleTogglePlay} />
      <div className="flex h-full w-full">
        <div className="w-[40%] h-full border-r border-slate-800 bg-slate-900">
          <CodeEditor code={sourceCode} onChange={handleCodeEdit} />
        </div>

        <div className="w-[60%] flex flex-col h-full">
          <div className="flex flex-row h-full relative flex-grow">
            <div className="flex-grow h-full relative">
              <WebGPUCanvas onSelect={setActiveSelection} events={compiledEvents} />
            </div>
            <div className="flex flex-col h-full shrink-0 shadow-lg z-10 w-64 border-l border-slate-700 bg-slate-900">
              <Inspector selection={activeSelection} onUpdate={() => {}} />
              <AICopilot 
                activeAST={activeSelection ? `${activeSelection.type}:${activeSelection.duration}` : "empty_state"}
                orchestrator={orchestrator}
                onCommit={(cmd) => { console.log('Committed ghost AST command:', cmd.payload); }}
              />
            </div>
          </div>
          <div className="shrink-0 border-t border-slate-800">
            <Mixer astState={astState} onUpdateAST={handleUpdateAST} />
          </div>
        </div>
      </div>
    </div>
  );
}
