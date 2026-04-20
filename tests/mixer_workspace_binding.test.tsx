import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SplitWorkspace from '../src/components/SplitWorkspace';
import '@testing-library/jest-dom';

// Mock child components to isolate Workspace layout and state binding
vi.mock('../src/components/WebGPUCanvas', () => ({
  default: () => <div data-testid="mock-canvas">Mock Canvas</div>
}));

vi.mock('../src/components/Inspector', () => ({
  default: () => <div data-testid="mock-inspector">Mock Inspector</div>
}));

vi.mock('../src/components/Mixer', () => ({
  default: ({ astState, onUpdateAST }: any) => (
    <div data-testid="mock-mixer" onClick={() => onUpdateAST({ tracks: [] })}>
      {astState && astState.tracks.length > 0 ? `Mixer Active: ${astState.tracks[0].id}` : 'Mixer Offline'}
    </div>
  )
}));

// Mock react-resizable-panels
vi.mock('react-resizable-panels', () => ({
  PanelGroup: ({ children, direction }: any) => <div data-testid={`panel-group-${direction}`}>{children}</div>,
  Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
  PanelResizeHandle: () => <div data-testid="resize-handle"></div>,
}));

describe('TDB-520: Stateless Mixer Workspace Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Must embed the Mixer into the Workspace and bind the global ASTState', () => {
    render(<SplitWorkspace />);
    
    const mixer = screen.getByTestId('mock-mixer');
    expect(mixer).toBeInTheDocument();
    
    // Verify the default ASTState is piped down successfully
    expect(mixer).toHaveTextContent('Mixer Active: vox');
  });
});
