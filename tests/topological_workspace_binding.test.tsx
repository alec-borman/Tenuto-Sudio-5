import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SplitWorkspace from '../src/components/SplitWorkspace';
import '@testing-library/jest-dom';

// Mock Canvas to mathematically trigger onMutation
vi.mock('../src/components/WebGPUCanvas', () => ({
  default: ({ onMutation, events }: any) => (
    <button 
      data-testid="mock-drag" 
      onClick={() => {
        if (events && events.length > 0 && onMutation) {
            onMutation(events[0], 12.5);
        }
      }}
    >
      Simulate Drag +1/8
    </button>
  )
}));

// Mock Monaco Editor for deterministic extraction
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, defaultLanguage }: any) => (
    <textarea
      data-testid="monaco-mock"
      aria-label="Tenuto Source Editor"
      data-language={defaultLanguage}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}));

// Isolate Workspace dependencies
vi.mock('react-resizable-panels', () => ({
  Group: ({ children }: any) => <div>{children}</div>,
  Panel: ({ children }: any) => <div>{children}</div>,
  Separator: () => <div></div>,
}));

vi.mock('../src/components/Inspector', () => ({ default: () => <div>Inspector</div> }));
vi.mock('../src/components/Mixer', () => ({ default: () => <div>Mixer</div> }));
vi.mock('../src/components/AICopilot', () => ({ default: () => <div>AICopilot</div> }));
vi.mock('../src/components/Transport', () => ({ default: () => <div>Transport</div> }));

describe('TDB-703: Bi-Directional Projectional Editing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('MUST translate visual canvas mutations into source code OT commands', () => {
    render(<SplitWorkspace />);
    
    const editor = screen.getByTestId('monaco-mock') as HTMLTextAreaElement;
    const dragButton = screen.getByTestId('mock-drag');
    
    // Initial State validation
    expect(editor.value).toBe('pno: c4:4');
    
    // Simulate graphical drag on Canvas (+1/8 duration delta pixel mapping)
    act(() => { fireEvent.click(dragButton); });
    
    // The visual drag MUST reverse-compile into the exact rational string mutation
    // 1/4 + 1/8 = 3/8
    expect(editor.value).toBe('pno: c4:3/8');
    
    // Verify Undo/Redo is still active to confirm CommandManager binding
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: false });
    expect(editor.value).toBe('pno: c4:4');
  });
});
