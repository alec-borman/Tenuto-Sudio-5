import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import WebGPUCanvas from './WebGPUCanvas';
import Inspector from './Inspector';

export default function SplitWorkspace() {
  const mockSelection = {
    type: 'PitchLit',
    duration: '1/4',
    velocity: 80,
    line: 1,
    col: 5
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
          <div className="h-full w-full relative flex">
            <div className="flex-grow h-full relative">
              <WebGPUCanvas />
            </div>
            <Inspector selection={mockSelection} onUpdate={() => {}} />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
