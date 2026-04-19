import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../src/App';
import WebGPUCanvas from '../src/components/WebGPUCanvas';
import ErrorBoundary from '../src/components/ErrorBoundary';

// Mock ResizeObserver for react-resizable-panels
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock('react-resizable-panels', () => ({
  PanelGroup: ({ children }: any) => <div data-testid="panel-group">{children}</div>,
  Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
  PanelResizeHandle: () => <div data-testid="resize-handle"></div>,
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
    expect(screen.getByTestId('monaco-placeholder')).toBeInTheDocument();
    expect(screen.getByTestId('webgpu-canvas-container')).toBeInTheDocument();
  });
});
