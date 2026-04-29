import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SplitWorkspace from '../src/components/SplitWorkspace';
import { ASTSerializer } from '../src/parser/ASTSerializer';
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

// Mock the heavy components
vi.mock('../src/components/WebGPUCanvas', () => ({
  default: ({ events }: any) => (
    <div data-testid="mock-canvas">
      Canvas Event Count: {events?.length || 0}
    </div>
  )
}));
vi.mock('../src/components/Inspector', () => ({ default: () => <div>Inspector</div> }));
vi.mock('../src/components/Mixer', () => ({ default: () => <div>Mixer</div> }));
vi.mock('../src/components/AICopilot', () => ({ default: () => <div>AICopilot</div> }));
vi.mock('../src/components/Transport', () => ({ default: () => <div>Transport</div> }));

vi.mock('react-resizable-panels', () => ({
  Group: ({ children, orientation }: any) => <div data-testid={`panel-group-${orientation}`}>{children}</div>,
  Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
  Separator: () => <div data-testid="resize-handle"></div>,
}));

describe('TDB-526: The Projectional Compiler Loop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Must continuously compile source text into AST events and pipe them to the Canvas', async () => {
    render(<SplitWorkspace />);
    
    const editorInput = screen.getByRole('textbox', { name: /Tenuto Source Editor/i });
    const canvasStatus = screen.getByTestId('mock-canvas');

    // 1. Initial Default State ("pno: c4:4") = 1 valid token
    await waitFor(() => {
      expect(canvasStatus).toHaveTextContent('Canvas Event Count: 1');
    });

    // 2. User types a new sequence
    fireEvent.change(editorInput, { target: { value: 'pno: c4:4 d:8 e:8' } });

    // The JIT compiler must parse the 3 tokens and route them to the Canvas
    await waitFor(() => {
      expect(canvasStatus).toHaveTextContent('Canvas Event Count: 3');
    });

    // 3. Graceful Degradation: User types an incomplete syntax error (e.g., 'f:')
    fireEvent.change(editorInput, { target: { value: 'pno: c4:4 d:8 e:8 f:' } });

    // The compiler must catch the error silently and RETAIN the last valid state (3 events)
    // It MUST NOT crash the UI or drop the canvas to 0 events.
    await new Promise(resolve => setTimeout(resolve, 100)); // Allow render cycle
    expect(canvasStatus).toHaveTextContent('Canvas Event Count: 3');
  });
});
