import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../src/App';

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

// Mock HTMLCanvasElement for Pixi.js in JSDOM
HTMLCanvasElement.prototype.getContext = vi.fn();

describe('Tenuto Studio 4.0 Genesis [TDB-501]', () => {
  it('renders the split-brain architecture and mounts the WebGPU canvas', () => {
    // Prevent Pixi errors in jsdom during test
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    // Architectural Determinism Checks
    expect(screen.getByTestId('monaco-placeholder')).toBeInTheDocument();
    expect(screen.getByTestId('webgpu-canvas-container')).toBeInTheDocument();
  });
});
