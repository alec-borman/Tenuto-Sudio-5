import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SplitWorkspace from '../src/components/SplitWorkspace';
import '@testing-library/jest-dom';

// Mock WebGPUCanvas to bypass PIXI rendering for the React state integration test
vi.mock('../src/components/WebGPUCanvas', () => ({
  default: ({ onSelect }: any) => (
    <div data-testid="mock-canvas" onClick={() => onSelect({ type: 'PitchLit', duration: '1/8', velocity: 100, line: 2, col: 1 })}>
      Mock Canvas
    </div>
  )
}));

// Mock Inspector to verify props are flowing correctly from the Workspace state
vi.mock('../src/components/Inspector', () => ({
  default: ({ selection }: any) => (
    <div data-testid="mock-inspector">
      {selection ? `Selected: ${selection.duration} at Line ${selection.line}` : 'No Selection'}
    </div>
  )
}));

// Mock react-resizable-panels to prevent ResizeObserver errors
vi.mock('react-resizable-panels', () => ({
  PanelGroup: ({ children }: any) => <div>{children}</div>,
  Panel: ({ children }: any) => <div>{children}</div>,
  PanelResizeHandle: () => <div></div>,
}));

describe('TDB-519: Global State & Context Inspector Binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Must lift state from the Canvas and pass the selected AST node to the Inspector', () => {
    render(<SplitWorkspace />);
    
    // Initially, there should be no selection
    expect(screen.getByTestId('mock-inspector')).toHaveTextContent('No Selection');
    
    // Simulate a pointertap/click on a projected AST node in the Canvas
    fireEvent.click(screen.getByTestId('mock-canvas'));
    
    // The SplitWorkspace must update state and re-render the Inspector with the new data
    expect(screen.getByTestId('mock-inspector')).toHaveTextContent('Selected: 1/8 at Line 2');
  });
});
