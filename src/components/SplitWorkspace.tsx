import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
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
  const playbackOrchestrator = useMemo(() => new PlaybackOrchestrator(serializer, new TCALManager(), audioManager), [audioManager, serializer]);

  const [compiledEvents, setCompiledEvents] = useState<any[]>([]);

  useEffect(() => {
    try {
      const eventsSequence = sourceCode.replace(/^[a-zA-Z_]+:\s*/, '').trim();
      if (!eventsSequence) {
        setCompiledEvents([]);
        return;
      }

      const tokens = eventsSequence.split(/\s+/).filter(Boolean);
      let cumulativeFraction = 0.0;

      const parsedEvents = tokens.map(token => {
        const event = serializer.parseToken(token);
        const eWithTime = {
          ...event,
          startTime: { numerator: cumulativeFraction, denominator: 1 },
          rawToken: token
        };
        cumulativeFraction += (event.duration.numerator / event.duration.denominator);
        return eWithTime;
      });

      setCompiledEvents(parsedEvents);
    } catch (e) {
      // Graceful Degradation: Silently catch partial syntaxes
    }
  }, [sourceCode, serializer]);

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
      <PanelGroup direction="horizontal" className="flex-grow">
        <Panel defaultSize={40} minSize={20}>
          <div className="h-full w-full border-r border-slate-800 bg-slate-900">
            <CodeEditor code={sourceCode} onChange={handleCodeEdit} />
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-slate-800 hover:bg-slate-700 transition-colors cursor-col-resize z-10" />

        <Panel minSize={30}>
          <PanelGroup direction="vertical">
            <Panel minSize={30}>
              <div className="h-full w-full relative flex">
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
            </Panel>
            <PanelResizeHandle className="h-1 bg-slate-800 hover:bg-slate-700 transition-colors cursor-row-resize z-10" />
            <Panel defaultSize={30} minSize={20}>
              <Mixer astState={astState} onUpdateAST={handleUpdateAST} />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}
