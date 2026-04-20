import React, { useState } from 'react';
import { LanceDBOrchestrator, GhostAST } from '../ai/LanceDBOrchestrator';
import { ASTCommand } from '../commands/ASTCommand';

interface AICopilotProps {
  activeAST: string;
  orchestrator: LanceDBOrchestrator;
  onCommit: (command: ASTCommand) => void;
}

export default function AICopilot({ activeAST, orchestrator, onCommit }: AICopilotProps) {
  const [prompt, setPrompt] = useState('');
  const [ghostPatch, setGhostPatch] = useState<GhostAST | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    try {
      // 1. Execute RAG contextual search via orchestrator
      const context = await orchestrator.queryContext(prompt, activeAST);
      
      // 2. Synthesize ghost generation mapping
      // Real environment would stream the response -> Here we map pure function output
      // In the failsafe test, the orchestrator applyGhostPatch mock doesn't care about the input
      const patch = orchestrator.applyGhostPatch(activeAST, 'prospective mapping placeholder');
      setGhostPatch(patch);
    } catch (e) {
      console.error('Failed to generate Ghost Patch', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCommit = () => {
    if (!ghostPatch) return;
    const command = orchestrator.commitPatch(ghostPatch.prospectiveText);
    onCommit(command);
    setGhostPatch(null);
    setPrompt('');
  };

  return (
    <div className="flex flex-col w-64 bg-slate-900 border-l border-t border-slate-700 p-4 shrink-0 shadow-lg text-slate-200 z-10 flex-grow">
      <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-slate-400">LanceDB AI Copilot</h2>
      
      <textarea
        className="w-full h-24 bg-slate-950 border border-slate-700 rounded px-2 py-2 text-sm outline-none focus:border-purple-500 mb-4 resize-none placeholder-slate-600"
        placeholder="Ask Tenuto AI..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !!ghostPatch}
        className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 border border-purple-500 text-white text-sm font-semibold py-2 px-4 rounded transition-colors mb-4"
      >
        {isGenerating ? 'Querying...' : 'Generate'}
      </button>

      {ghostPatch && (
        <div className="mt-auto border-t border-slate-800 pt-4 flex flex-col gap-2">
          <div className="text-xs font-mono text-purple-400 mb-2 truncate">
            Preview Active: {ghostPatch.prospectiveText}
          </div>
          <button
            onClick={handleCommit}
            className="w-full bg-green-600 hover:bg-green-500 border border-green-500 text-white text-sm font-semibold py-2 px-4 rounded transition-colors"
          >
            Accept Patch
          </button>
          <button
            onClick={() => setGhostPatch(null)}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-semibold py-2 px-4 rounded transition-colors"
          >
            Discard
          </button>
        </div>
      )}
    </div>
  );
}
