import React, { useState, useMemo, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import WebGPUCanvas from './WebGPUCanvas';
import Inspector from './Inspector';
import Mixer, { ASTState } from './Mixer';
import AICopilot from './AICopilot';
import { LanceDBOrchestrator } from '../ai/LanceDBOrchestrator';
import { CommandManager } from '../commands/CommandManager';

export default function SplitWorkspace() {
  const [activeSelection, setActiveSelection] = useState<any>(null);
  const [astState, setAstState] = useState<ASTState>({
    tracks: [{ id: 'vox', volume: 100, fx: [] }],
    meta: { sidechain: null }
  });
  
  const orchestrator = useMemo(() => new LanceDBOrchestrator(), []);
  const commandManager = useMemo(() => new CommandManager(), []);

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandManager]);

  const handleUpdateAST = (newStatePayload: Partial<ASTState>) => {
    const prevState = { ...astState };
    const nextState = { ...astState, ...newStatePayload };
    
    commandManager.executeCommand({
      execute: () => setAstState(nextState),
      undo: () => setAstState(prevState)
    });
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={40} minSize={20}>
          <div className="h-full w-full flex items-center justify-center border-r border-slate-800 bg-slate-900">
            <div data-testid="monaco-placeholder" className="text-sm font-mono text-slate-400">
              Code
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-slate-800 hover:bg-slate-700 transition-colors cursor-col-resize z-10" />

        <Panel minSize={30}>
          <PanelGroup direction="vertical">
            <Panel minSize={30}>
              <div className="h-full w-full relative flex">
                <div className="flex-grow h-full relative">
                  <WebGPUCanvas onSelect={setActiveSelection} />
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
