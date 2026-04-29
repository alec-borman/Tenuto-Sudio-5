import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SplitWorkspace from '../src/components/SplitWorkspace';
import { CommandManager } from '../src/commands/CommandManager';
import '@testing-library/jest-dom';

// Mock Monaco Editor for deterministic JSDOM testing to avoid Web Worker crashes
vi.mock('@monaco-editor/react', () => {
  return {
    default: ({ value, onChange, defaultLanguage }: any) => (
      <textarea
        data-testid="monaco-mock"
        aria-label="Tenuto Source Editor"
        data-language={defaultLanguage}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  };
});

// Mock surrounding heavy UI components to isolate the Code Editor binding
vi.mock('../src/components/WebGPUCanvas', () => ({ default: () => <div>Canvas</div> }));
vi.mock('../src/components/Inspector', () => ({ default: () => <div>Inspector</div> }));
vi.mock('../src/components/Mixer', () => ({ default: () => <div>Mixer</div> }));
vi.mock('../src/components/AICopilot', () => ({ default: () => <div>AICopilot</div> }));

vi.mock('react-resizable-panels', () => ({
  Group: ({ children, orientation }: any) => <div data-testid={`panel-group-${orientation}`}>{children}</div>,
  Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
  Separator: () => <div data-testid="resize-handle"></div>,
}));

describe('TDB-523: The Code Editor Matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Must render the CodeEditor, accept typing mutations, and allow Undo/Redo traversal', () => {
    render(<SplitWorkspace />);
    
    // 1. Verify the placeholder is gone and the Editor is mounted
    expect(screen.queryByTestId('monaco-placeholder')).not.toBeInTheDocument();
    const editorInput = screen.getByRole('textbox', { name: /Tenuto Source Editor/i });
    expect(editorInput).toBeInTheDocument();
    
    // 2. Initial state verification
    expect(editorInput).toHaveValue('pno: c4:4');
    
    // 3. User types new code
    fireEvent.change(editorInput, { target: { value: 'pno: c4:8 d:8' } });
    expect(editorInput).toHaveValue('pno: c4:8 d:8');
    
    // 4. Trigger Undo (Ctrl+Z) to verify the text mutation was routed through the CommandManager
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: false });
    expect(editorInput).toHaveValue('pno: c4:4'); 
    
    // 5. Trigger Redo (Ctrl+Shift+Z)
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(editorInput).toHaveValue('pno: c4:8 d:8'); 
  });
});
