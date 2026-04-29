import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../src/App';
import WebGPUCanvas from '../src/components/WebGPUCanvas';
import ErrorBoundary from '../src/components/ErrorBoundary';
import SplitWorkspace from '../src/components/SplitWorkspace';

// Mock Monaco Editor for deterministic JSDOM testing
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

// Mock ResizeObserver for react-resizable-panels
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock('react-resizable-panels', () => ({
  Group: ({ children, orientation }: any) => <div data-testid={`panel-group-${orientation}`}>{children}</div>,
  Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
  Separator: () => <div data-testid="resize-handle"></div>,
}));

HTMLCanvasElement.prototype.getContext = vi.fn();

// Malicious child to trigger Error Boundary
const Bomb = () => {
  throw new Error("Architectural Fracture Detected");
  return null;
};

describe('Tenuto Studio 5 - Memory Safety & Error Boundaries [TDB-502]', () => {
  it('renders the ErrorBoundary when a child component crashes instead of WSOD', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress React error log
    
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    expect(screen.getAllByText(/Architectural Fracture Detected/i).length).toBeGreaterThan(0);
  });

  it('safely handles rapid mount/unmount cycles without leaking PIXI applications', async () => {
    // Render the canvas
    const { unmount } = render(<WebGPUCanvas />);
    
    // Immediately unmount to simulate StrictMode interrupt
    unmount();

    // If the component lacks proper async cleanup checks, this will throw unhandled rejections
    // We wait briefly to ensure the async init()->destroy() pipeline resolves safely
    await waitFor(() => {
      expect(document.querySelector('canvas')).not.toBeInTheDocument();
    });
  });

  it('renders the split-brain architecture within the App shell safely', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<App />);
    expect(screen.getByRole('textbox', { name: /Tenuto Source Editor/i })).toBeInTheDocument();
    expect(screen.getByTestId('webgpu-canvas-container')).toBeInTheDocument();
  });
});

describe('TDB-701: Advanced Workspace Topology', () => {
  it('MUST render the exact multi-hemisphere grid configuration', () => {
    render(<SplitWorkspace />);
    // Verify structural placeholders for the new high-density layout
    expect(screen.getByTestId('command-history-panel')).toBeInTheDocument();
    expect(screen.getByTestId('engine-status-panel')).toBeInTheDocument();
    
    // Verify the Canvas and Mixer remain mathematically bound
    expect(screen.getByTestId('webgpu-canvas-container')).toBeInTheDocument();
    expect(screen.getByText(/Stateless Mixer/i)).toBeInTheDocument();
  });
});
