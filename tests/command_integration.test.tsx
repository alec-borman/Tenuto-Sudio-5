import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SplitWorkspace from '../src/components/SplitWorkspace';
import '@testing-library/jest-dom';

// Mock child components to expose mutation triggers directly for testing
vi.mock('../src/components/WebGPUCanvas', () => ({
  default: () => <div data-testid="mock-canvas">Mock Canvas</div>
}));
vi.mock('../src/components/Inspector', () => ({
  default: () => <div data-testid="mock-inspector">Mock Inspector</div>
}));
vi.mock('../src/components/AICopilot', () => ({
  default: () => <div data-testid="mock-copilot">Mock Copilot</div>
}));
vi.mock('../src/components/Mixer', () => ({
  default: ({ astState, onUpdateAST }: any) => (
    <button 
      data-testid="mock-mixer-mutate" 
      onClick={() => onUpdateAST({ tracks: [{ id: 'mutated_track', volume: 50, fx: [] }], meta: { sidechain: null } })}
    >
      {astState?.tracks?.[0]?.id || 'default'}
    </button>
  )
}));
vi.mock('react-resizable-panels', () => ({
  PanelGroup: ({ children }: any) => <div>{children}</div>,
  Panel: ({ children }: any) => <div>{children}</div>,
  PanelResizeHandle: () => <div></div>,
}));

describe('TDB-522: Global Command Integration (Undo/Redo)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Must execute an AST mutation, then successfully Undo and Redo via keyboard shortcuts', () => {
    render(<SplitWorkspace />);
    
    const mutateBtn = screen.getByTestId('mock-mixer-mutate');
    
    // 1. Initial state verification (Assuming default track is 'vox' from TDB-520)
    expect(mutateBtn).toHaveTextContent('vox');
    
    // 2. Trigger a mutation
    fireEvent.click(mutateBtn);
    expect(mutateBtn).toHaveTextContent('mutated_track');
    
    // 3. Trigger Undo (Ctrl + Z)
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: false });
    expect(mutateBtn).toHaveTextContent('vox'); // Should revert to original
    
    // 4. Trigger Redo (Ctrl + Shift + Z)
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(mutateBtn).toHaveTextContent('mutated_track'); // Should re-apply mutation
  });
});
